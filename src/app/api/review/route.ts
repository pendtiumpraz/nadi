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
        SELECT slug, title, category, author, date, author_id, updated_at, status
        FROM articles WHERE status IN ('in_review', 'approved', 'consent_received') ORDER BY updated_at DESC
    `;
    const media = await sql`
        SELECT m.slug, m.title, m.type, m.category, m.author_id, m.date, m.status, u.name AS author_name
        FROM media m
        LEFT JOIN users u ON u.id = m.author_id
        WHERE m.status = 'in_review' ORDER BY m.date DESC
    `;
    const events = await sql`
        SELECT e.slug, e.title, e.category, e.date, e.author_id, e.publish_status, u.name AS author_name
        FROM events e
        LEFT JOIN users u ON u.id = e.author_id
        WHERE e.publish_status = 'in_review' ORDER BY e.date DESC
    `;

    return NextResponse.json({
        articles: articles.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category,
            author: r.author,
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            updatedAt: r.updated_at,
            status: r.status,
        })),
        media: media.map((r) => ({
            slug: r.slug,
            title: r.title,
            type: r.type,
            category: r.category,
            author: (r.author_name as string) || "",
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            status: r.status,
        })),
        events: events.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category,
            author: (r.author_name as string) || "",
            date: r.date ? new Date(r.date as string).toISOString().split("T")[0] : "",
            publishStatus: r.publish_status,
        })),
    });
}
