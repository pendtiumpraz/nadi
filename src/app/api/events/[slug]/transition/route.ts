import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventBySlug, updateEventPublishStatus } from "@/lib/events-store";
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
import type { EventPublishStatus } from "@/data/events/types";

type Action = "submit" | "approve" | "request_changes";

interface Params {
    params: Promise<{ slug: string }>;
}

// Transition the publication state of an event.
// Events have NO consent step — approve goes straight to published.
// - submit          : draft / in_review → in_review              (author OR reviewer/admin)
// - request_changes : in_review → draft (with notes)             (reviewer/admin)
// - approve         : in_review → published                      (reviewer/admin)
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

    const event = await getEventBySlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const currentPublishStatus: EventPublishStatus = (event.publishStatus as EventPublishStatus) || "published";

    let nextStatus: EventPublishStatus;
    if (action === "submit") {
        if (!canEditOwnContent(session.user, event.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // Only valid source states: draft (first submit) or in_review (resubmit-after-feedback).
        if (currentPublishStatus !== "draft" && currentPublishStatus !== "in_review") {
            return NextResponse.json({ error: `Cannot submit from publish_status='${currentPublishStatus}'` }, { status: 400 });
        }
        nextStatus = "in_review";
    } else if (action === "approve") {
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (currentPublishStatus !== "in_review") {
            return NextResponse.json({ error: `Cannot approve from publish_status='${currentPublishStatus}'` }, { status: 400 });
        }
        // Events have no consent step — approve goes straight to published.
        nextStatus = "published";
    } else {
        // request_changes
        if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        if (currentPublishStatus !== "in_review") {
            return NextResponse.json({ error: `Can only request changes on an event currently in review (publish_status was '${currentPublishStatus}').` }, { status: 400 });
        }
        nextStatus = "draft";
    }

    await updateEventPublishStatus(slug, nextStatus);

    // Audit row in submissions table
    const sql = getDB();
    await sql`
        INSERT INTO submissions (type, ref_slug, author_id, reviewer_id, status, notes)
        VALUES (
            'event',
            ${slug},
            ${event.authorId ? Number(event.authorId) : null},
            ${session.user.id ? Number(session.user.id) : null},
            ${nextStatus},
            ${notes}
        )
    `;

    // Fire-and-forget notifications — reuse article notify helpers (UX matches).
    const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const author = event.authorId ? await getUserById(event.authorId) : null;

    if (action === "submit") {
        notifyArticleSubmitted({
            title: event.title,
            slug,
            actorName: session.user.name || "A contributor",
            baseUrl,
        }).catch(() => { });
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: event.title, slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    } else if (action === "approve" && author?.email) {
        // Events have no consent step — fire the "approved" email but point CTA to the live event page.
        const eventUrl = `${baseUrl}/events/${slug}`;
        notifyArticleApproved({ title: event.title, slug, authorEmail: author.email, consentUrl: eventUrl, baseUrl }).catch(() => { });
    } else if (action === "request_changes" && author?.email) {
        notifyArticleChangesRequested({ title: event.title, slug, authorEmail: author.email, notes, baseUrl }).catch(() => { });
    }

    return NextResponse.json({ success: true, publishStatus: nextStatus });
}
