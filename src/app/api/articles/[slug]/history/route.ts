import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getArticleBySlugStore } from "@/lib/articles-store";
import { getDB } from "@/lib/db";

interface Params {
    params: Promise<{ slug: string }>;
}

interface SubmissionRow {
    id: number;
    status: string;
    notes: string | null;
    created_at: string | Date;
    actor_name: string | null;
    actor_role: string | null;
    actor_id: number | null;
    reviewer_name: string | null;
    reviewer_role: string | null;
    reviewer_id: number | null;
}

interface HistoryEntry {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    actor: { id: string | null; name: string; role: string | null };
    reviewer: { id: string | null; name: string | null; role: string | null };
}

// GET /api/articles/[slug]/history
// Returns the chronological list of submission audit rows for an article so
// the admin / reviewer can see who did what and when. Access: admin / reviewer
// always; the article's own author so they can audit feedback timestamps.
export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;
    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const isAuthor = !!session.user.id && String(session.user.id) === String(article.authorId);
    if (!canReview(session.user) && !isAuthor) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = getDB();
    const rows = (await sql`
        SELECT s.id, s.status, s.notes, s.created_at,
               s.author_id  AS actor_id,
               u.name       AS actor_name,
               u.role       AS actor_role,
               s.reviewer_id,
               r.name       AS reviewer_name,
               r.role       AS reviewer_role
        FROM submissions s
        LEFT JOIN users u ON u.id = s.author_id
        LEFT JOIN users r ON r.id = s.reviewer_id
        WHERE s.type = 'article' AND s.ref_slug = ${slug}
        ORDER BY s.created_at ASC
    `) as unknown as SubmissionRow[];

    const history: HistoryEntry[] = rows.map((r) => ({
        id: String(r.id),
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        actor: {
            id: r.actor_id != null ? String(r.actor_id) : null,
            name: r.actor_name || (r.actor_id ? `User #${r.actor_id}` : "System"),
            role: r.actor_role,
        },
        reviewer: {
            id: r.reviewer_id != null ? String(r.reviewer_id) : null,
            name: r.reviewer_name,
            role: r.reviewer_role,
        },
    }));

    return NextResponse.json({ history });
}
