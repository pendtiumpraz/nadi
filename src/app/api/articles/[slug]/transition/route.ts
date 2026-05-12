import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleBySlugStore, updateArticleStatus } from "@/lib/articles-store";
import { canReview, canPublish, canEditOwnContent } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { getUserById } from "@/lib/users";
import {
    notifyArticleSubmitted,
    notifyArticleApproved,
    notifyArticleChangesRequested,
    notifySubmissionReceived,
    notifyArticlePublished,
    getReviewEtaDays,
} from "@/lib/notify";
import { signConsentToken } from "@/lib/consent-token";
import type { ArticleStatus } from "@/data/articles/types";

type Action = "submit" | "approve" | "request_changes" | "publish";

interface Params {
    params: Promise<{ slug: string }>;
}

// Transition the publication state of an article.
// - submit            : draft / revisions → in_review            (author OR reviewer/admin)
// - request_changes   : in_review → draft (with notes)           (reviewer/admin)
// - approve           : in_review → approved (+ consent email)   (reviewer/admin)
// - publish           : consent_received → published             (admin/reviewer)
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;
    const notes = (body.notes as string) || "";

    if (!["submit", "approve", "request_changes", "publish"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    let nextStatus: ArticleStatus;
    if (action === "submit") {
        if (!canEditOwnContent(session.user, article.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // Only valid source states: draft (first submit) or in_review (resubmit-after-feedback).
        if (article.status !== "draft" && article.status !== "in_review") {
            return NextResponse.json({ error: `Cannot submit from status='${article.status}'` }, { status: 400 });
        }
        nextStatus = "in_review";
    } else if (action === "approve") {
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (article.status !== "in_review") {
            return NextResponse.json({ error: `Cannot approve from status='${article.status}'` }, { status: 400 });
        }
        nextStatus = "approved";
    } else if (action === "request_changes") {
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (article.status !== "in_review") {
            return NextResponse.json({ error: `Can only request changes on an article currently in review (status was '${article.status}').` }, { status: 400 });
        }
        nextStatus = "draft";
    } else {
        // publish
        if (!canPublish(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (article.status !== "consent_received") {
            return NextResponse.json({ error: "Article must have a submitted consent form before publishing." }, { status: 400 });
        }
        nextStatus = "published";
    }

    await updateArticleStatus(slug, nextStatus);

    // Audit row in submissions table
    const sql = getDB();
    await sql`
        INSERT INTO submissions (type, ref_slug, author_id, reviewer_id, status, notes)
        VALUES (
            'article',
            ${slug},
            ${article.authorId ? Number(article.authorId) : null},
            ${session.user.id ? Number(session.user.id) : null},
            ${nextStatus},
            ${notes}
        )
    `;

    // Fire-and-forget notifications
    const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const author = article.authorId ? await getUserById(article.authorId) : null;

    if (action === "submit") {
        notifyArticleSubmitted({
            title: article.title,
            slug,
            actorName: session.user.name || "A contributor",
            baseUrl,
        }).catch(() => { });
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: article.title, slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    } else if (action === "approve" && author?.email) {
        // Generate signed consent-form URL (30-day TTL by default)
        const token = signConsentToken(slug);
        const consentUrl = `${baseUrl}/consent/${slug}?token=${encodeURIComponent(token)}`;
        notifyArticleApproved({ title: article.title, slug, authorEmail: author.email, consentUrl, baseUrl }).catch(() => { });
    } else if (action === "request_changes" && author?.email) {
        notifyArticleChangesRequested({ title: article.title, slug, authorEmail: author.email, notes, baseUrl }).catch(() => { });
    } else if (action === "publish" && author?.email) {
        notifyArticlePublished({ title: article.title, slug, authorEmail: author.email, baseUrl }).catch(() => { });
    }

    return NextResponse.json({ success: true, status: nextStatus });
}
