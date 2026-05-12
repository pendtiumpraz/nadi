import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMediaBySlug, updateMediaStatus } from "@/lib/media-store";
import { canReview, canEditOwnContent } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { getUserById } from "@/lib/users";
import {
    notifyArticleSubmitted,
    notifyArticleApproved,
    notifyArticleChangesRequested,
    notifySubmissionReceived,
    getReviewEtaDays,
} from "@/lib/notify";
import type { MediaStatus } from "@/data/media/types";

type Action = "submit" | "approve" | "request_changes";

interface Params {
    params: Promise<{ slug: string }>;
}

// Transition the publication state of a media item.
// Media skips the consent step, so admin "approve" goes straight to published.
// - submit            : draft / in_review → in_review            (author OR reviewer/admin)
// - request_changes   : in_review → draft (with notes)            (reviewer/admin)
// - approve           : in_review → published                     (reviewer/admin)
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;
    const notes = (body.notes as string) || "";

    if (!["submit", "approve", "request_changes"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const media = await getMediaBySlug(slug);
    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });

    let nextStatus: MediaStatus;
    if (action === "submit") {
        if (!canEditOwnContent(session.user, media.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (media.status !== "draft" && media.status !== "in_review") {
            return NextResponse.json({ error: `Cannot submit from status='${media.status}'` }, { status: 400 });
        }
        nextStatus = "in_review";
    } else if (action === "approve") {
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (media.status !== "in_review") {
            return NextResponse.json({ error: `Cannot approve from status='${media.status}'` }, { status: 400 });
        }
        // Media has no consent step — approve goes straight to published.
        nextStatus = "published";
    } else {
        // request_changes
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (media.status !== "in_review") {
            return NextResponse.json({ error: `Can only request changes on media currently in review (status was '${media.status}').` }, { status: 400 });
        }
        nextStatus = "draft";
    }

    await updateMediaStatus(slug, nextStatus);

    // Audit row in submissions table (type='media').
    const sql = getDB();
    await sql`
        INSERT INTO submissions (type, ref_slug, author_id, reviewer_id, status, notes)
        VALUES (
            'media',
            ${slug},
            ${media.authorId ? Number(media.authorId) : null},
            ${session.user.id ? Number(session.user.id) : null},
            ${nextStatus},
            ${notes}
        )
    `;

    // Fire-and-forget notifications. Reuse article notify helpers — body wording is
    // generic enough ("your work") that title + slug carry enough context.
    const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const author = media.authorId ? await getUserById(media.authorId) : null;

    if (action === "submit") {
        notifyArticleSubmitted({
            title: media.title,
            slug,
            actorName: session.user.name || "A contributor",
            baseUrl,
        }).catch(() => { });
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: media.title, slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    } else if (action === "approve" && author?.email) {
        // Media skips consent — no consent URL needed. We still notify approval,
        // pointing the CTA at the public media page since it's now live.
        const consentUrl = `${baseUrl}/media`;
        notifyArticleApproved({ title: media.title, slug, authorEmail: author.email, consentUrl, baseUrl }).catch(() => { });
    } else if (action === "request_changes" && author?.email) {
        notifyArticleChangesRequested({ title: media.title, slug, authorEmail: author.email, notes, baseUrl }).catch(() => { });
    }

    return NextResponse.json({ success: true, status: nextStatus });
}
