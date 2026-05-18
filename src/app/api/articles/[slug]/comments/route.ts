import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleBySlugStore, setFeedbackPending } from "@/lib/articles-store";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { getUserById } from "@/lib/users";
import { notifyFeedbackReceived, notifyAuthorReply } from "@/lib/notify";
import { createNotification, createNotificationForUsers, getUserIdsByRole } from "@/lib/notifications-store";

interface Params {
    params: Promise<{ slug: string }>;
}

interface CommentRow {
    id: number | string;
    article_slug: string;
    author_id: number | string | null;
    author_role: string | null;
    body: string;
    section_anchor: string | null;
    created_at: string | Date;
    name: string | null;
}

interface CommentDTO {
    id: string;
    body: string;
    authorId: string | null;
    authorRole: string | null;
    authorName: string | null;
    createdAt: string;
}

function rowToDTO(row: CommentRow): CommentDTO {
    return {
        id: String(row.id),
        body: row.body,
        authorId: row.author_id != null ? String(row.author_id) : null,
        authorRole: row.author_role,
        authorName: row.name,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
}

// GET /api/articles/[slug]/comments
// Returns the comment thread (oldest first) for the article identified by slug.
// Allowed: admin / reviewer always; the article author otherwise.
export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;

    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const isReviewer = canReview(session.user);
    const isAuthor = !!session.user.id && String(session.user.id) === String(article.authorId);
    if (!isReviewer && !isAuthor) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = getDB();
    const rows = (await sql`
        SELECT c.*, u.name
        FROM article_comments c
        LEFT JOIN users u ON u.id = c.author_id
        WHERE c.article_slug = ${slug}
        ORDER BY c.created_at ASC
    `) as unknown as CommentRow[];

    return NextResponse.json({ comments: rows.map(rowToDTO) });
}

// POST /api/articles/[slug]/comments
// Adds a new comment to the article's thread. If the commenter is a
// reviewer/admin, the article is flagged feedback_pending and the author is
// emailed.
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;

    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const isReviewer = canReview(session.user);
    const isAuthor = !!session.user.id && String(session.user.id) === String(article.authorId);
    if (!isReviewer && !isAuthor) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const rawBody = typeof payload.body === "string" ? payload.body : "";
    const trimmed = rawBody.trim();
    if (!trimmed) {
        return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
    }
    const sectionAnchor = typeof payload.sectionAnchor === "string" && payload.sectionAnchor.length > 0
        ? payload.sectionAnchor
        : null;

    const authorId = session.user.id ? Number(session.user.id) : null;
    const authorRole = session.user.role || null;

    const sql = getDB();
    const inserted = (await sql`
        INSERT INTO article_comments (article_slug, author_id, author_role, body, section_anchor)
        VALUES (${slug}, ${authorId}, ${authorRole}, ${trimmed}, ${sectionAnchor})
        RETURNING id, article_slug, author_id, author_role, body, section_anchor, created_at
    `) as unknown as CommentRow[];

    const row = inserted[0];
    // Attach the commenter's name without an extra round-trip — we already
    // have it on the session.
    row.name = session.user.name || null;

    if (isReviewer) {
        try {
            await setFeedbackPending(slug);
        } catch (err) {
            console.error("[comments] setFeedbackPending failed:", (err as Error).message);
        }

        // Fire-and-forget email to the article author.
        const baseUrl =
            req.nextUrl?.origin ||
            `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
        (async () => {
            try {
                const author = article.authorId ? await getUserById(article.authorId) : null;
                if (author?.email) {
                    await notifyFeedbackReceived({
                        title: article.title,
                        slug,
                        authorEmail: author.email,
                        commenterName: session.user.name || "A reviewer",
                        commentBody: trimmed,
                        baseUrl,
                    });
                }
            } catch (err) {
                console.error("[comments] notifyFeedbackReceived failed:", (err as Error).message);
            }
        })();

        if (article.authorId) {
            createNotification({
                userId: Number(article.authorId),
                type: "comment_posted",
                title: `New comment on: ${article.title}`,
                body: `${session.user.name || "A reviewer"}: ${trimmed.slice(0, 140)}${trimmed.length > 140 ? "…" : ""}`,
                link: `/admin/articles/${slug}`,
            }).catch(() => { });
        }
    } else {
        // Author commented — let admins + reviewers know via the bell.
        Promise.all([getUserIdsByRole("admin"), getUserIdsByRole("reviewer")])
            .then(([admins, reviewers]) =>
                createNotificationForUsers([...admins, ...reviewers], {
                    type: "comment_posted",
                    title: `Author replied on: ${article.title}`,
                    body: `${session.user.name || "The author"}: ${trimmed.slice(0, 140)}${trimmed.length > 140 ? "…" : ""}`,
                    link: `/admin/articles/${slug}`,
                })
            ).catch(() => { });

        // And email every admin + reviewer with the reply body, CC'ing the
        // standing notification list from Settings → Notifications. Mirrors
        // notifyFeedbackReceived for the reverse direction so the thread is
        // genuinely two-way over email.
        const baseUrl =
            req.nextUrl?.origin ||
            `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
        notifyAuthorReply({
            title: article.title,
            slug,
            authorName: session.user.name || "The author",
            commentBody: trimmed,
            baseUrl,
        }).catch((err) => {
            console.error("[comments] notifyAuthorReply failed:", (err as Error).message);
        });
    }

    return NextResponse.json({ comment: rowToDTO(row) }, { status: 201 });
}
