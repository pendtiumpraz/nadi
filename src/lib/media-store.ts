import { getDB } from "@/lib/db";
import type { NADIMedia, MediaType, MediaStatus } from "@/data/media/types";

export async function getAllMedia(): Promise<NADIMedia[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM media ORDER BY date DESC`;
    return rows.map(rowToMedia);
}

export async function getMediaBySlug(slug: string): Promise<NADIMedia | null> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM media WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) return null;
    return rowToMedia(rows[0]);
}

export async function saveMedia(media: NADIMedia): Promise<void> {
    const sql = getDB();
    // Defensive default: a save that doesn't pass status stays unpublished.
    // All callers (API routes) set status explicitly based on role + intent.
    const status: MediaStatus = media.status || "draft";
    const authorId = media.authorId ? Number(media.authorId) : null;
    const feedbackPending = !!media.feedbackPending;
    await sql`
    INSERT INTO media (slug, title, description, type, embed_url, thumbnail_url, date, duration, speakers, category, keywords, status, author_id, feedback_pending)
    VALUES (${media.slug}, ${media.title}, ${media.description}, ${media.type}, ${media.embedUrl}, ${media.thumbnailUrl || ""}, ${media.date}, ${media.duration || ""}, ${media.speakers || []}, ${media.category}, ${media.keywords || []}, ${status}, ${authorId}, ${feedbackPending})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
      embed_url = EXCLUDED.embed_url, thumbnail_url = EXCLUDED.thumbnail_url,
      date = EXCLUDED.date, duration = EXCLUDED.duration,
      speakers = EXCLUDED.speakers, category = EXCLUDED.category,
      keywords = EXCLUDED.keywords,
      status = EXCLUDED.status,
      feedback_pending = EXCLUDED.feedback_pending
  `;
}

export async function deleteMedia(slug: string): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM media WHERE slug = ${slug}`;
}

export async function mediaExists(slug: string): Promise<boolean> {
    const sql = getDB();
    const rows = await sql`SELECT 1 FROM media WHERE slug = ${slug} LIMIT 1`;
    return rows.length > 0;
}

export async function updateMediaStatus(slug: string, status: MediaStatus): Promise<void> {
    const sql = getDB();
    await sql`UPDATE media SET status = ${status} WHERE slug = ${slug}`;
}

export async function setMediaFeedbackPending(slug: string): Promise<void> {
    const sql = getDB();
    await sql`UPDATE media SET feedback_pending = true WHERE slug = ${slug}`;
}

export async function clearMediaFeedbackPending(slug: string): Promise<void> {
    const sql = getDB();
    await sql`UPDATE media SET feedback_pending = false WHERE slug = ${slug}`;
}

export async function getMediaByAuthor(authorId: string): Promise<NADIMedia[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM media WHERE author_id = ${Number(authorId)} ORDER BY date DESC`;
    return rows.map(rowToMedia);
}

function rowToMedia(row: Record<string, unknown>): NADIMedia {
    return {
        slug: row.slug as string,
        title: row.title as string,
        description: (row.description as string) || "",
        type: (row.type as MediaType) || "video",
        embedUrl: (row.embed_url as string) || "",
        thumbnailUrl: (row.thumbnail_url as string) || "",
        date: row.date ? new Date(row.date as string).toISOString().split("T")[0] : "",
        duration: (row.duration as string) || "",
        speakers: (row.speakers as string[]) || [],
        category: (row.category as string) || "Health Policy",
        keywords: (row.keywords as string[]) || [],
        createdAt: (row.created_at as string) || new Date().toISOString(),
        status: (row.status as MediaStatus) || "published",
        authorId: row.author_id != null ? String(row.author_id) : undefined,
        feedbackPending: !!row.feedback_pending,
    };
}
