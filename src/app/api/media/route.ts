import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllMedia,
    getMediaBySlug,
    getMediaByAuthor,
    saveMedia,
    deleteMedia,
    mediaExists,
} from "@/lib/media-store";
import { canPublish, canEditOwnContent } from "@/lib/permissions";
import { getUserById } from "@/lib/users";
import { notifyArticleSubmitted, notifySubmissionReceived, getReviewEtaDays } from "@/lib/notify";
import type { NADIMedia, MediaStatus } from "@/data/media/types";

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function buildBaseUrl(req: NextRequest): string {
    return req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
}

async function fireSubmitEmails(req: NextRequest, media: NADIMedia, actorName: string): Promise<void> {
    const baseUrl = buildBaseUrl(req);
    notifyArticleSubmitted({ title: media.title, slug: media.slug, actorName, baseUrl }).catch(() => { });
    if (media.authorId) {
        const author = await getUserById(media.authorId);
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: media.title, slug: media.slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (slug) {
        const item = await getMediaBySlug(slug);
        if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(item);
    }
    // Authors (contributor / partner) only see media they created. Reviewers
    // and admins see the whole catalogue so they can moderate / publish.
    const items = canPublish(session.user)
        ? await getAllMedia()
        : await getMediaByAuthor(session.user.id);
    return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        const body = await req.json();
        if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });

        const slug = slugify(body.title);
        if (await mediaExists(slug)) return NextResponse.json({ error: "Media with this slug already exists" }, { status: 400 });

        // Decide status: contributors/partners can never publish directly.
        // Admins/reviewers can publish unless they explicitly chose draft/in_review.
        let status: MediaStatus;
        if (canPublish(session.user)) {
            status = (body.status as MediaStatus) || "published";
        } else if (body.submit) {
            status = "in_review";
        } else {
            status = "draft";
        }

        const media: NADIMedia = {
            slug,
            title: body.title,
            description: body.description || "",
            type: body.type || "video",
            embedUrl: body.embedUrl || "",
            thumbnailUrl: body.thumbnailUrl || "",
            date: body.date || new Date().toISOString().split("T")[0],
            duration: body.duration || "",
            speakers: body.speakers || [],
            category: body.category || "Health Policy",
            keywords: body.keywords || [],
            createdAt: new Date().toISOString(),
            status,
            authorId: body.authorId || session.user.id,
            feedbackPending: false,
        };

        await saveMedia(media);
        // Fire submission emails when a non-publisher creates a row that lands in_review
        if (status === "in_review" && !canPublish(session.user)) {
            fireSubmitEmails(req, media, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(media, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        const body = await req.json();
        if (!body.slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

        const existing = await getMediaBySlug(body.slug);
        if (!existing) return NextResponse.json({ error: "Media not found" }, { status: 404 });

        // Permission check: contributor/partner can only edit own media
        if (!canEditOwnContent(session.user, existing.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Status policy on edit (mirrors articles, minus the consent state):
        // - admin/reviewer: keeps existing OR caller-supplied status
        // - non-publisher editing a `published` row MUST NOT regress it to draft.
        // - non-publisher submit:true → in_review; else preserve draft/in_review.
        const lockedStates: MediaStatus[] = ["published"];
        let status: MediaStatus;
        if (canPublish(session.user)) {
            status = (body.status as MediaStatus) || existing.status || "draft";
        } else if (lockedStates.includes(existing.status as MediaStatus)) {
            status = existing.status as MediaStatus;
        } else if (body.submit) {
            status = "in_review";
        } else {
            status = existing.status === "in_review" ? "in_review" : "draft";
        }
        const wasInReview = existing.status === "in_review";

        const media: NADIMedia = {
            slug: body.slug,
            title: body.title || existing.title,
            description: body.description ?? existing.description,
            type: body.type || existing.type,
            embedUrl: body.embedUrl ?? existing.embedUrl,
            thumbnailUrl: body.thumbnailUrl ?? existing.thumbnailUrl ?? "",
            date: body.date || existing.date,
            duration: body.duration ?? existing.duration ?? "",
            speakers: body.speakers || existing.speakers || [],
            category: body.category || existing.category,
            keywords: body.keywords || existing.keywords || [],
            createdAt: existing.createdAt,
            status,
            authorId: existing.authorId || body.authorId,
            // Partner re-saving clears feedback_pending (they've addressed comments).
            // Admin/reviewer re-saving doesn't touch it.
            feedbackPending: canPublish(session.user) ? !!existing.feedbackPending : false,
        };

        await saveMedia(media);
        // Fire submission emails when a non-publisher transitions to in_review.
        if (status === "in_review" && !wasInReview && !canPublish(session.user)) {
            fireSubmitEmails(req, media, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(media);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const existing = await getMediaBySlug(slug);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Owner-or-admin gate.
    if (!canEditOwnContent(session.user, existing.authorId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Non-publishers can only delete their own DRAFTS.
    if (!canPublish(session.user) && existing.status && existing.status !== "draft") {
        return NextResponse.json(
            { error: "Cannot delete media once submitted. Contact an admin to take it down." },
            { status: 403 }
        );
    }

    await deleteMedia(slug);
    return NextResponse.json({ success: true });
}
