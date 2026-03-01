import { Article } from "./types";

// Static articles (bundled at build time)
import healthFinancing from "./health-financing-southeast-asia.json";
import vaccineGovernance from "./vaccine-governance-global-south.json";
import policyCoherence from "./policy-coherence-universal-health-coverage.json";

const staticArticles: Article[] = [
    healthFinancing as Article,
    vaccineGovernance as Article,
    policyCoherence as Article,
];

// For server components: combine static + blob articles
export async function getAllArticlesAsync(): Promise<Article[]> {
    const IS_VERCEL = !!process.env.VERCEL;
    if (IS_VERCEL) {
        try {
            const { list } = await import("@vercel/blob");
            const { blobs } = await list({ prefix: "articles/" });
            const blobArticles: Article[] = [];
            for (const blob of blobs) {
                try {
                    const res = await fetch(blob.url, { cache: "no-store" });
                    blobArticles.push(await res.json());
                } catch { /* skip */ }
            }
            // Merge: blob articles override static ones with same slug
            const merged = new Map<string, Article>();
            for (const a of staticArticles) merged.set(a.slug, a);
            for (const a of blobArticles) merged.set(a.slug, a);
            return Array.from(merged.values()).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        } catch {
            return staticArticles.sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
    }
    // Local dev: read from filesystem
    try {
        const fs = await import("fs");
        const path = await import("path");
        const dir = path.join(process.cwd(), "src/data/articles");
        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(".json"));
        const articles = files.map((f: string) => {
            const raw = fs.readFileSync(path.join(dir, f), "utf-8");
            return JSON.parse(raw) as Article;
        });
        return articles.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    } catch {
        return staticArticles.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
}

// Synchronous version (static articles only, used at build time)
export function getAllArticles(): Article[] {
    return staticArticles.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getArticleBySlug(slug: string): Article | undefined {
    return staticArticles.find((a) => a.slug === slug);
}

export function getLatestArticles(count: number = 3): Article[] {
    return getAllArticles().slice(0, count);
}
