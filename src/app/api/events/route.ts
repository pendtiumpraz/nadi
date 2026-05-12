import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllEvents, getEventBySlug, getEventsByAuthor, saveEvent, deleteEvent, eventExists, uploadEventImage } from "@/lib/events-store";
import { canPublish, canEditOwnContent, asRole } from "@/lib/permissions";
import { getUserById } from "@/lib/users";
import { notifyArticleSubmitted, notifySubmissionReceived, getReviewEtaDays } from "@/lib/notify";
import type { NADIEvent, EventPublishStatus } from "@/data/events/types";

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function buildBaseUrl(req: NextRequest): string {
    return req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
}

async function fireSubmitEmails(req: NextRequest, event: NADIEvent, actorName: string): Promise<void> {
    const baseUrl = buildBaseUrl(req);
    notifyArticleSubmitted({ title: event.title, slug: event.slug, actorName, baseUrl }).catch(() => { });
    if (event.authorId) {
        const author = await getUserById(event.authorId);
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: event.title, slug: event.slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (slug) {
        const event = await getEventBySlug(slug);
        if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(event);
    }
    // Partners only see their own events; admin/reviewer/contributor see all.
    const events = asRole(session.user.role) === "partner"
        ? await getEventsByAuthor(session.user.id)
        : await getAllEvents();
    return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        const formData = await req.formData();
        const title = formData.get("title") as string;
        if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

        const slug = slugify(title);
        if (await eventExists(slug)) return NextResponse.json({ error: "Event with this slug already exists" }, { status: 400 });

        let imageUrl = "";
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            imageUrl = await uploadEventImage(slug, buffer, imageFile.name);
        }

        // Decide publish status: contributors/partners can never publish directly.
        // Admins/reviewers can publish unless they explicitly chose draft/in_review.
        const submitFlag = formData.get("submit");
        const wantsSubmit = submitFlag === "true" || submitFlag === "1";
        const requestedPublishStatus = (formData.get("publishStatus") as EventPublishStatus) || undefined;
        let publishStatus: EventPublishStatus;
        if (canPublish(session.user)) {
            publishStatus = requestedPublishStatus || "published";
        } else if (wantsSubmit) {
            publishStatus = "in_review";
        } else {
            publishStatus = "draft";
        }

        const event: NADIEvent = {
            slug,
            title,
            description: (formData.get("description") as string) || "",
            date: (formData.get("date") as string) || new Date().toISOString().split("T")[0],
            time: (formData.get("time") as string) || "",
            location: (formData.get("location") as string) || "",
            locationType: (formData.get("locationType") as NADIEvent["locationType"]) || "onsite",
            category: (formData.get("category") as NADIEvent["category"]) || "seminar",
            imageUrl,
            registrationUrl: (formData.get("registrationUrl") as string) || "",
            status: (formData.get("status") as NADIEvent["status"]) || "upcoming",
            speakers: ((formData.get("speakers") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
            organizer: (formData.get("organizer") as string) || "NADI",
            createdAt: new Date().toISOString(),
            publishStatus,
            authorId: session.user.id,
            feedbackPending: false,
        };

        await saveEvent(event);
        // Fire submission emails when a non-publisher creates a row that lands in_review
        if (publishStatus === "in_review" && !canPublish(session.user)) {
            fireSubmitEmails(req, event, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(event, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        const formData = await req.formData();
        const slug = formData.get("slug") as string;
        if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

        const existing = await getEventBySlug(slug);
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Permission check: non-publishers can only edit their own events
        if (!canEditOwnContent(session.user, existing.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let imageUrl = existing.imageUrl || "";
        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            imageUrl = await uploadEventImage(slug, buffer, imageFile.name);
        }

        // Status policy on edit (mirrors articles):
        // - admin/reviewer: keeps existing OR caller-supplied publish_status
        // - non-publisher: cannot regress an already-published event back to draft
        // - non-publisher with submit flag: → in_review
        // - non-publisher without submit: stays draft (or stays in_review if it was)
        const submitFlag = formData.get("submit");
        const wantsSubmit = submitFlag === "true" || submitFlag === "1";
        const requestedPublishStatus = (formData.get("publishStatus") as EventPublishStatus) || undefined;
        const existingPublishStatus: EventPublishStatus = (existing.publishStatus as EventPublishStatus) || "published";

        const lockedStates: EventPublishStatus[] = ["published"];
        let publishStatus: EventPublishStatus;
        if (canPublish(session.user)) {
            publishStatus = requestedPublishStatus || existingPublishStatus || "draft";
        } else if (lockedStates.includes(existingPublishStatus)) {
            // Partner / contributor cannot regress a published event by saving.
            publishStatus = existingPublishStatus;
        } else if (wantsSubmit) {
            publishStatus = "in_review";
        } else {
            publishStatus = existingPublishStatus === "in_review" ? "in_review" : "draft";
        }
        const wasInReview = existingPublishStatus === "in_review";

        // Partner re-saving clears feedback_pending (they've addressed the comments).
        // Admin/reviewer re-saving doesn't touch it.
        const feedbackPending = canPublish(session.user) ? !!existing.feedbackPending : false;

        const event: NADIEvent = {
            slug,
            title: (formData.get("title") as string) || existing.title || "",
            description: (formData.get("description") as string) || "",
            date: (formData.get("date") as string) || new Date().toISOString().split("T")[0],
            time: (formData.get("time") as string) || "",
            location: (formData.get("location") as string) || "",
            locationType: (formData.get("locationType") as NADIEvent["locationType"]) || "onsite",
            category: (formData.get("category") as NADIEvent["category"]) || "seminar",
            imageUrl,
            registrationUrl: (formData.get("registrationUrl") as string) || "",
            status: (formData.get("status") as NADIEvent["status"]) || "upcoming",
            speakers: ((formData.get("speakers") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
            organizer: (formData.get("organizer") as string) || "NADI",
            createdAt: existing.createdAt || new Date().toISOString(),
            publishStatus,
            authorId: existing.authorId || session.user.id,
            feedbackPending,
        };

        await saveEvent(event);
        // Fire submission emails when a non-publisher transitions an event TO in_review
        if (publishStatus === "in_review" && !wasInReview && !canPublish(session.user)) {
            fireSubmitEmails(req, event, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(event);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const existing = await getEventBySlug(slug);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canEditOwnContent(session.user, existing.authorId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Non-publishers can ONLY delete their own DRAFTS. Anything in_review or published
    // is locked — only an admin or reviewer can delete those.
    const existingPublishStatus: EventPublishStatus = (existing.publishStatus as EventPublishStatus) || "published";
    if (!canPublish(session.user) && existingPublishStatus !== "draft") {
        return NextResponse.json(
            { error: "Cannot delete an event once submitted. Contact an admin to take it down." },
            { status: 403 }
        );
    }

    await deleteEvent(slug);
    return NextResponse.json({ success: true });
}
