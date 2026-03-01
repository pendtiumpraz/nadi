import { put, list, del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import type { Article } from "@/data/articles/types";

const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_DIR = path.join(process.cwd(), "src/data/articles");

// ── READ all articles ──
export async function getAllArticlesStore(): Promise<Article[]> {
    if (IS_VERCEL) {
        return getAllFromBlob();
    }
    return getAllFromFS();
}

// ── READ single article ──
export async function getArticleBySlugStore(slug: string): Promise<Article | null> {
    const articles = await getAllArticlesStore();
    return articles.find((a) => a.slug === slug) || null;
}

// ── SAVE article (create or update) ──
export async function saveArticle(article: Article): Promise<void> {
    if (IS_VERCEL) {
        await saveToBlob(article);
    } else {
        saveToFS(article);
    }
}

// ── DELETE article ──
export async function deleteArticle(slug: string): Promise<void> {
    if (IS_VERCEL) {
        await deleteFromBlob(slug);
    } else {
        deleteFromFS(slug);
    }
}

// ── CHECK existence ──
export async function articleExists(slug: string): Promise<boolean> {
    if (IS_VERCEL) {
        const articles = await getAllFromBlob();
        return articles.some((a) => a.slug === slug);
    }
    return fs.existsSync(path.join(LOCAL_DIR, `${slug}.json`));
}

// ══════════════════════════════════════════
// Vercel Blob Storage
// ══════════════════════════════════════════
async function getAllFromBlob(): Promise<Article[]> {
    try {
        const { blobs } = await list({ prefix: "articles/" });
        const articles: Article[] = [];
        for (const blob of blobs) {
            try {
                const res = await fetch(blob.url);
                const article = (await res.json()) as Article;
                articles.push(article);
            } catch {
                // skip corrupted blobs
            }
        }
        return articles.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    } catch {
        return [];
    }
}

async function saveToBlob(article: Article): Promise<void> {
    const content = JSON.stringify(article, null, 2);
    await put(`articles/${article.slug}.json`, content, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
    });
}

async function deleteFromBlob(slug: string): Promise<void> {
    const { blobs } = await list({ prefix: `articles/${slug}.json` });
    for (const blob of blobs) {
        await del(blob.url);
    }
}

// ══════════════════════════════════════════
// Local File System (dev)
// ══════════════════════════════════════════
function getAllFromFS(): Article[] {
    try {
        const files = fs.readdirSync(LOCAL_DIR).filter((f) => f.endsWith(".json"));
        return files
            .map((f) => {
                const raw = fs.readFileSync(path.join(LOCAL_DIR, f), "utf-8");
                return JSON.parse(raw) as Article;
            })
            .sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
    } catch {
        return [];
    }
}

function saveToFS(article: Article): void {
    const filePath = path.join(LOCAL_DIR, `${article.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2), "utf-8");
}

function deleteFromFS(slug: string): void {
    const filePath = path.join(LOCAL_DIR, `${slug}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
