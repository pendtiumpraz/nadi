import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllMedia, saveMedia, deleteMedia, mediaExists } from "@/lib/media-store";
import type { NADIMedia } from "@/data/media/types";

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const slug = new URL(req.url).searchParams.get("slug");
    if (slug) {
        const item = await getMediaBySlugAPI(slug);
        if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(item);
    }
    return NextResponse.json(await getAllMedia());
}

async function getMediaBySlugAPI(slug: string) {
    const all = await getAllMedia();
    return all.find((m) => m.slug === slug) || null;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        const body = await req.json();
        if (!body.title) return NextResponse.json({ error: "Title required" }, { status: 400 });

        const slug = slugify(body.title);
        if (await mediaExists(slug)) return NextResponse.json({ error: "Media with this slug already exists" }, { status: 400 });

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
            createdAt: new Date().toISOString(),
        };

        await saveMedia(media);
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

        const existing = await getMediaBySlugAPI(body.slug);
        const media: NADIMedia = {
            slug: body.slug,
            title: body.title || existing?.title || "",
            description: body.description || "",
            type: body.type || "video",
            embedUrl: body.embedUrl || "",
            thumbnailUrl: body.thumbnailUrl || "",
            date: body.date || new Date().toISOString().split("T")[0],
            duration: body.duration || "",
            speakers: body.speakers || [],
            category: body.category || "Health Policy",
            createdAt: existing?.createdAt || new Date().toISOString(),
        };

        await saveMedia(media);
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
    if (!(await mediaExists(slug))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteMedia(slug);
    return NextResponse.json({ success: true });
}
