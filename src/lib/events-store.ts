import { getDB } from "@/lib/db";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import type { NADIEvent } from "@/data/events/types";

export async function getAllEvents(): Promise<NADIEvent[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM events ORDER BY date DESC`;
    return rows.map(rowToEvent);
}

export async function getEventBySlug(slug: string): Promise<NADIEvent | null> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM events WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) return null;
    return rowToEvent(rows[0]);
}

export async function saveEvent(event: NADIEvent): Promise<void> {
    const sql = getDB();
    await sql`
    INSERT INTO events (slug, title, description, date, time, location, location_type, category, image_url, registration_url, status, speakers, organizer)
    VALUES (${event.slug}, ${event.title}, ${event.description}, ${event.date}, ${event.time}, ${event.location}, ${event.locationType}, ${event.category}, ${event.imageUrl}, ${event.registrationUrl || ""}, ${event.status}, ${event.speakers || []}, ${event.organizer})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description, date = EXCLUDED.date,
      time = EXCLUDED.time, location = EXCLUDED.location, location_type = EXCLUDED.location_type,
      category = EXCLUDED.category, image_url = EXCLUDED.image_url,
      registration_url = EXCLUDED.registration_url, status = EXCLUDED.status,
      speakers = EXCLUDED.speakers, organizer = EXCLUDED.organizer
  `;
}

export async function deleteEvent(slug: string): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM events WHERE slug = ${slug}`;
}

export async function eventExists(slug: string): Promise<boolean> {
    const sql = getDB();
    const rows = await sql`SELECT 1 FROM events WHERE slug = ${slug} LIMIT 1`;
    return rows.length > 0;
}

// Upload event image to blob (still use blob for images — binary files)
export async function uploadEventImage(slug: string, file: Buffer, filename: string): Promise<string> {
    const IS_VERCEL = !!process.env.VERCEL;
    if (IS_VERCEL) {
        const blob = await put(`events/images/${slug}-${filename}`, file, {
            access: "public", addRandomSuffix: false,
        });
        return blob.url;
    }
    const publicDir = path.join(process.cwd(), "public/uploads/events");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    const localPath = path.join(publicDir, `${slug}-${filename}`);
    fs.writeFileSync(localPath, file);
    return `/uploads/events/${slug}-${filename}`;
}

function rowToEvent(row: Record<string, unknown>): NADIEvent {
    return {
        slug: row.slug as string,
        title: row.title as string,
        description: (row.description as string) || "",
        date: row.date ? new Date(row.date as string).toISOString().split("T")[0] : "",
        time: (row.time as string) || "",
        location: (row.location as string) || "",
        locationType: (row.location_type as NADIEvent["locationType"]) || "onsite",
        category: (row.category as NADIEvent["category"]) || "seminar",
        imageUrl: (row.image_url as string) || "",
        registrationUrl: (row.registration_url as string) || "",
        status: (row.status as NADIEvent["status"]) || "upcoming",
        speakers: (row.speakers as string[]) || [],
        organizer: (row.organizer as string) || "NADI",
        createdAt: (row.created_at as string) || new Date().toISOString(),
    };
}
