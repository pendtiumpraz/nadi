import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleBySlugStore, updateArticleStatus, setFeedbackPending } from "@/lib/articles-store";
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
import { createNotification, createNotificationForUsers, getUserIdsByRole } from "@/lib/notifications-store";
import { signConsentToken } from "@/lib/consent-token";
import { checkSubmissionAllowed } from "@/lib/submission-throttle";
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
        // Daily submission cap — exempts publishers (admin/reviewer).
        if (!canPublish(session.user)) {
            const check = await checkSubmissionAllowed(session.user.id);
            if (!check.ok) {
                return NextResponse.json({ error: check.error }, { status: 429 });
            }
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

    // When the reviewer sends an article back with notes, post those notes into
    // the article's comment thread so the author can see them inline (not just
    // in the email). Also flag feedback_pending so the editor banner shows.
    if (action === "request_changes" && notes.trim()) {
        try {
            await sql`
                INSERT INTO article_comments (article_slug, author_id, author_role, body, section_anchor)
                VALUES (
                    ${slug},
                    ${session.user.id ? Number(session.user.id) : null},
                    ${session.user.role || null},
                    ${notes.trim()},
                    NULL
                )
            `;
            await setFeedbackPending(slug);
        } catch (err) {
            console.error("[transition] failed to mirror request_changes notes into comments:", (err as Error).message);
        }
    }

    // Mirror submit (and re-submit) as a system comment in the article thread so
    // partners can see their own submission events alongside reviewer feedback.
    if (action === "submit") {
        try {
            const verb = article.feedbackPending ? "re-submitted this article for review after revisions" : "submitted this article for review";
            await sql`
                INSERT INTO article_comments (article_slug, author_id, author_role, body, section_anchor)
                VALUES (
                    ${slug},
                    ${session.user.id ? Number(session.user.id) : null},
                    ${session.user.role || null},
                    ${`${session.user.name || "The author"} ${verb}.`},
                    NULL
                )
            `;
        } catch (err) {
            console.error("[transition] failed to record submit comment:", (err as Error).message);
        }
    }

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
        // In-app: notify all reviewers + admins
        Promise.all([getUserIdsByRole("admin"), getUserIdsByRole("reviewer")])
            .then(([admins, reviewers]) =>
                createNotificationForUsers([...admins, ...reviewers], {
                    type: article.feedbackPending ? "article_resubmitted" : "article_submitted",
                    title: article.feedbackPending ? `Re-submitted: ${article.title}` : `New submission: ${article.title}`,
                    body: `${session.user.name || "A contributor"} ${article.feedbackPending ? "re-submitted after revisions" : "submitted this article for review"}.`,
                    link: `/admin/articles/${slug}`,
                })
            ).catch(() => { });
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: article.title, slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    } else if (action === "approve") {
        if (author?.email) {
            // Generate signed consent-form URL (30-day TTL by default)
            const token = signConsentToken(slug);
            const consentUrl = `${baseUrl}/consent/${slug}?token=${encodeURIComponent(token)}`;
            notifyArticleApproved({ title: article.title, slug, authorEmail: author.email, consentUrl, baseUrl }).catch(() => { });
        }
        if (article.authorId) {
            createNotification({
                userId: Number(article.authorId),
                type: "article_approved",
                title: `Approved: ${article.title}`,
                body: "Open the consent form link emailed to you to publish this article.",
                link: `/admin/articles/${slug}`,
            }).catch(() => { });
        }
    } else if (action === "request_changes") {
        if (author?.email) {
            notifyArticleChangesRequested({ title: article.title, slug, authorEmail: author.email, notes, baseUrl }).catch(() => { });
        }
        if (article.authorId) {
            createNotification({
                userId: Number(article.authorId),
                type: "article_changes_requested",
                title: `Changes requested: ${article.title}`,
                body: notes || "Open the article to read the reviewer's notes.",
                link: `/admin/articles/${slug}`,
            }).catch(() => { });
        }
    } else if (action === "publish") {
        if (author?.email) {
            notifyArticlePublished({ title: article.title, slug, authorEmail: author.email, baseUrl }).catch(() => { });
        }
        if (article.authorId) {
            createNotification({
                userId: Number(article.authorId),
                type: "article_published",
                title: `Published: ${article.title}`,
                body: "Your article is now live on the public site.",
                link: `/publications/${slug}`,
            }).catch(() => { });
        }
    }

    return NextResponse.json({ success: true, status: nextStatus });
}
