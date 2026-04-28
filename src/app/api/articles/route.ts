import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllArticlesStore,
    getArticleBySlugStore,
    saveArticle,
    deleteArticle,
    articleExists,
} from "@/lib/articles-store";
import { canPublish, canEditOwnContent } from "@/lib/permissions";
import type { Article, ArticleStatus } from "@/data/articles/types";

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// GET all articles (or single by slug query param)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
        const article = await getArticleBySlugStore(slug);
        if (!article)
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(article);
    }

    const articles = await getAllArticlesStore();
    return NextResponse.json(articles);
}

// POST create new article
// Body may include `submit: true` to send straight to review (used by contributors).
// Admins/reviewers can pass `status` directly.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body: Article & { submit?: boolean } = await req.json();
        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!body.slug) body.slug = slugify(body.title);
        if (await articleExists(body.slug)) {
            return NextResponse.json(
                { error: "Article with this slug already exists" },
                { status: 400 }
            );
        }

        if (!body.date) body.date = new Date().toISOString().split("T")[0];
        if (!body.author) body.author = session.user.name || "NADI";
        if (!body.readTime) body.readTime = "5 min read";
        if (!body.coverColor) body.coverColor = "charcoal";
        if (!body.category) body.category = "ARTICLE";
        if (!body.seo) body.seo = { description: "", keywords: [] };
        if (!body.blocks) body.blocks = [];

        // Decide status: contributors/partners can never publish directly.
        // Admins/reviewers can publish unless they explicitly chose draft/in_review.
        let status: ArticleStatus;
        if (canPublish(session.user)) {
            status = (body.status as ArticleStatus) || "published";
        } else if (body.submit) {
            status = "in_review";
        } else {
            status = "draft";
        }
        body.status = status;
        body.authorId = body.authorId || session.user.id;

        await saveArticle(body);
        return NextResponse.json(body, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

// PUT update article
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body: Article & { submit?: boolean } = await req.json();
        if (!body.slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const existing = await getArticleBySlugStore(body.slug);
        if (!existing) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // Permission check: contributor can only edit own articles
        if (!canEditOwnContent(session.user, existing.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Status policy on edit:
        // - admin/reviewer: keeps existing OR caller-supplied status
        // - contributor: editing a published/in_review article moves it back to in_review when they submit;
        //   otherwise stays draft. They cannot publish.
        let status: ArticleStatus;
        if (canPublish(session.user)) {
            status = (body.status as ArticleStatus) || existing.status || "published";
        } else if (body.submit) {
            status = "in_review";
        } else {
            // keep existing review state if it was in_review; otherwise back to draft
            status = existing.status === "in_review" ? "in_review" : "draft";
        }
        body.status = status;
        body.authorId = existing.authorId || body.authorId;

        await saveArticle(body);
        return NextResponse.json(body);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

// DELETE article
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
        return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const existing = await getArticleBySlugStore(slug);
    if (!existing) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only admin/reviewer or original author can delete
    if (!canEditOwnContent(session.user, existing.authorId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteArticle(slug);
    return NextResponse.json({ success: true });
}
