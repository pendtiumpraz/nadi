import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
    try {
        const sql = getDB();
        const rows = await sql`SELECT * FROM media ORDER BY date DESC`;
        const media = rows.map((r) => ({
            slug: r.slug,
            title: r.title,
            description: r.description || "",
            type: r.type || "video",
            embedUrl: r.embed_url || "",
            thumbnailUrl: r.thumbnail_url || "",
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            duration: r.duration || "",
            speakers: r.speakers || [],
            category: r.category || "Health Policy",
        }));
        return NextResponse.json({ media });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
