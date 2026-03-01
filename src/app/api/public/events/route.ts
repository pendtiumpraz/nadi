import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
    try {
        const sql = getDB();
        const rows = await sql`SELECT * FROM events ORDER BY date DESC`;
        const events = rows.map((r) => ({
            slug: r.slug,
            title: r.title,
            description: r.description || "",
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            time: r.time || "",
            location: r.location || "",
            locationType: r.location_type || "onsite",
            category: r.category || "seminar",
            imageUrl: r.image_url || "",
            status: r.status || "upcoming",
            speakers: r.speakers || [],
            organizer: r.organizer || "NADI",
        }));
        return NextResponse.json({ events });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
