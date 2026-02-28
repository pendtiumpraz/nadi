import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import type { Article } from "@/data/articles/types";

const ARTICLES_DIR = path.join(process.cwd(), "src/data/articles");

function getAllArticleFiles(): Article[] {
    const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
        const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf-8");
        return JSON.parse(raw) as Article;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET all articles
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json(getAllArticleFiles());
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
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Auto-generate slug if not provided
        if (!article.slug) {
            article.slug = slugify(article.title);
        }

        // Check slug uniqueness
        const filePath = path.join(ARTICLES_DIR, `${article.slug}.json`);
        if (fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Article with this slug already exists" }, { status: 400 });
        }

        // Set defaults
        if (!article.date) article.date = new Date().toISOString().split("T")[0];
        if (!article.author) article.author = session.user.name || "NADI";
        if (!article.readTime) article.readTime = "5 min read";
        if (!article.coverColor) article.coverColor = "charcoal";
        if (!article.category) article.category = "ARTICLE";
        if (!article.seo) article.seo = { description: "", keywords: [] };
        if (!article.blocks) article.blocks = [];

        fs.writeFileSync(filePath, JSON.stringify(article, null, 2), "utf-8");

        // Update index.ts to include new article
        await rebuildIndex();

        return NextResponse.json(article, { status: 201 });
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
        const article: Article = await req.json();
        if (!article.slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const filePath = path.join(ARTICLES_DIR, `${article.slug}.json`);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        fs.writeFileSync(filePath, JSON.stringify(article, null, 2), "utf-8");
        await rebuildIndex();

        return NextResponse.json(article);
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

    const filePath = path.join(ARTICLES_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    await rebuildIndex();

    return NextResponse.json({ success: true });
}

// Rebuild the index.ts file dynamically
async function rebuildIndex() {
    const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
    const imports: string[] = [];
    const names: string[] = [];

    files.forEach((f, i) => {
        const varName = `article${i}`;
        imports.push(`import ${varName} from "./${f}";`);
        names.push(`${varName} as Article`);
    });

    const code = `import { Article } from "./types";

${imports.join("\n")}

const articles: Article[] = [
  ${names.join(",\n  ")},
];

export function getAllArticles(): Article[] {
  return articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getLatestArticles(count: number = 3): Article[] {
  return getAllArticles().slice(0, count);
}
`;

    fs.writeFileSync(path.join(ARTICLES_DIR, "index.ts"), code, "utf-8");
}
