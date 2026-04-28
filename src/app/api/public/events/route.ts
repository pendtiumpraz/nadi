import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

function mapRow(r: Record<string, unknown>) {
    return {
        slug: r.slug as string,
        title: r.title as string,
        description: (r.description as string) || "",
        date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
        time: (r.time as string) || "",
        location: (r.location as string) || "",
        locationType: (r.location_type as string) || "onsite",
        category: (r.category as string) || "seminar",
        imageUrl: (r.image_url as string) || "",
        registrationUrl: (r.registration_url as string) || "",
        status: (r.status as string) || "upcoming",
        speakers: (r.speakers as string[]) || [],
        organizer: (r.organizer as string) || "NADI",
    };
}

export async function GET(req: NextRequest) {
    try {
        const sql = getDB();
        const slug = new URL(req.url).searchParams.get("slug");
        if (slug) {
            const rows = await sql`SELECT * FROM events WHERE slug = ${slug} AND publish_status = 'published' LIMIT 1`;
            if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
            return NextResponse.json({ event: mapRow(rows[0] as Record<string, unknown>) });
        }
        const rows = await sql`SELECT * FROM events WHERE publish_status = 'published' ORDER BY date DESC`;
        const events = rows.map((r) => mapRow(r as Record<string, unknown>));
        return NextResponse.json({ events });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
