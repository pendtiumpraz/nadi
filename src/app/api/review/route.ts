import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";

// Returns everything currently in review across articles, media, and events.
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canReview(session.user)) {
        return NextResponse.json({ error: "Reviewer or admin role required" }, { status: 403 });
    }

    const sql = getDB();
    const articles = await sql`
        SELECT slug, title, category, author, date, author_id, updated_at
        FROM articles WHERE status = 'in_review' ORDER BY updated_at DESC
    `;
    const media = await sql`
        SELECT slug, title, type, category, author_id, date
        FROM media WHERE status = 'in_review' ORDER BY date DESC
    `;
    const events = await sql`
        SELECT slug, title, category, date, author_id
        FROM events WHERE publish_status = 'in_review' ORDER BY date DESC
    `;

    return NextResponse.json({
        articles: articles.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category,
            author: r.author,
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            updatedAt: r.updated_at,
        })),
        media: media.map((r) => ({
            slug: r.slug,
            title: r.title,
            type: r.type,
            category: r.category,
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
        })),
        events: events.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category,
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
        })),
    });
}
