import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllArticlesStore,
    getArticleBySlugStore,
    saveArticle,
    deleteArticle,
    articleExists,
} from "@/lib/articles-store";
import type { Article } from "@/data/articles/types";

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
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const article: Article = await req.json();
        if (!article.title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!article.slug) {
            article.slug = slugify(article.title);
        }

        // Check uniqueness
        if (await articleExists(article.slug)) {
            return NextResponse.json(
                { error: "Article with this slug already exists" },
                { status: 400 }
            );
        }

        // Set defaults
        if (!article.date) article.date = new Date().toISOString().split("T")[0];
        if (!article.author) article.author = session.user.name || "NADI";
        if (!article.readTime) article.readTime = "5 min read";
        if (!article.coverColor) article.coverColor = "charcoal";
        if (!article.category) article.category = "ARTICLE";
        if (!article.seo) article.seo = { description: "", keywords: [] };
        if (!article.blocks) article.blocks = [];

        await saveArticle(article);
        return NextResponse.json(article, { status: 201 });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
    }
}

// PUT update article
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const article: Article = await req.json();
        if (!article.slug) {
            return NextResponse.json(
                { error: "Slug is required" },
                { status: 400 }
            );
        }

        await saveArticle(article);
        return NextResponse.json(article);
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 400 }
        );
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

    if (!(await articleExists(slug))) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await deleteArticle(slug);
    return NextResponse.json({ success: true });
}
