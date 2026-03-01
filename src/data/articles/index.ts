import { Article } from "./types";
import { getDB } from "@/lib/db";

// Static articles (fallback)
import healthFinancing from "./health-financing-southeast-asia.json";
import vaccineGovernance from "./vaccine-governance-global-south.json";
import policyCoherence from "./policy-coherence-universal-health-coverage.json";

const staticArticles: Article[] = [
    healthFinancing as Article,
    vaccineGovernance as Article,
    policyCoherence as Article,
];

// Async: fetch from database (preferred)
export async function getAllArticlesAsync(): Promise<Article[]> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT * FROM articles ORDER BY date DESC`;
        if (rows.length > 0) {
            return rows.map((row) => ({
                slug: row.slug as string,
                title: row.title as string,
                subtitle: (row.subtitle as string) || "",
                category: (row.category as string) || "ARTICLE",
                date: row.date ? new Date(row.date as string).toISOString().split("T")[0] : "",
                readTime: (row.read_time as string) || "5 min read",
                author: (row.author as string) || "NADI",
                coverColor: (row.cover_color as "crimson" | "charcoal" | "dark") || "charcoal",
                seo: {
                    description: (row.seo_description as string) || "",
                    keywords: (row.seo_keywords as string[]) || [],
                },
                blocks: (row.blocks as Article["blocks"]) || [],
            }));
        }
    } catch { /* fallback to static */ }
    return staticArticles.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

// Sync: static articles only (build-time fallback)
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
