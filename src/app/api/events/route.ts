import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllEvents, saveEvent, deleteEvent, eventExists, uploadEventImage } from "@/lib/events-store";
import type { NADIEvent } from "@/data/events/types";

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (slug) {
        const events = await getAllEvents();
        const event = events.find((e) => e.slug === slug);
        if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(event);
    }
    return NextResponse.json(await getAllEvents());
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
        };

        await saveEvent(event);
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

        const existing = (await getAllEvents()).find(e => e.slug === slug);
        let imageUrl = existing?.imageUrl || "";

        const imageFile = formData.get("image") as File | null;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            imageUrl = await uploadEventImage(slug, buffer, imageFile.name);
        }

        const event: NADIEvent = {
            slug,
            title: (formData.get("title") as string) || existing?.title || "",
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
            createdAt: existing?.createdAt || new Date().toISOString(),
        };

        await saveEvent(event);
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
    if (!(await eventExists(slug))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteEvent(slug);
    return NextResponse.json({ success: true });
}
