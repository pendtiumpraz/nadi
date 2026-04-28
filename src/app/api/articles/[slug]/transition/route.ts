import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getArticleBySlugStore, updateArticleStatus } from "@/lib/articles-store";
import { canReview, canEditOwnContent } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import { getUserById } from "@/lib/users";
import { notifyArticleSubmitted, notifyArticleApproved, notifyArticleChangesRequested } from "@/lib/notify";

type Action = "submit" | "approve" | "request_changes";

interface Params {
    params: Promise<{ slug: string }>;
}

// Transition the publication state of an article.
// - submit (any author of the article OR reviewer/admin): draft → in_review
// - approve (reviewer/admin): in_review → published
// - request_changes (reviewer/admin): in_review → draft  (with notes)
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;
    const notes = (body.notes as string) || "";

    if (!["submit", "approve", "request_changes"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    if (action === "submit") {
        if (!canEditOwnContent(session.user, article.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        await updateArticleStatus(slug, "in_review");
    } else {
        if (!canReview(session.user)) {
            return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });
        }
        await updateArticleStatus(slug, action === "approve" ? "published" : "draft");
    }

    // Audit row in submissions table
    const sql = getDB();
    await sql`
        INSERT INTO submissions (type, ref_slug, author_id, reviewer_id, status, notes)
        VALUES (
            'article',
            ${slug},
            ${article.authorId ? Number(article.authorId) : null},
            ${session.user.id ? Number(session.user.id) : null},
            ${action === "submit" ? "in_review" : action === "approve" ? "published" : "draft"},
            ${notes}
        )
    `;

    // Fire-and-forget notifications
    const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    if (action === "submit") {
        notifyArticleSubmitted({
            title: article.title,
            slug,
            actorName: session.user.name || "A contributor",
            baseUrl,
        }).catch(() => { });
    } else {
        const author = article.authorId ? await getUserById(article.authorId) : null;
        if (author?.email) {
            if (action === "approve") {
                notifyArticleApproved({ title: article.title, slug, authorEmail: author.email, baseUrl }).catch(() => { });
            } else {
                notifyArticleChangesRequested({ title: article.title, slug, authorEmail: author.email, notes, baseUrl }).catch(() => { });
            }
        }
    }

    return NextResponse.json({ success: true, status: action === "submit" ? "in_review" : action === "approve" ? "published" : "draft" });
}
