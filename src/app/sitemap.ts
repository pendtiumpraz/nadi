import { MetadataRoute } from "next";
import { getDB } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nadi-health.id";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const sql = getDB();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
        { url: `${SITE_URL}/publications`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/media`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ];

    // Dynamic: articles
    let articlePages: MetadataRoute.Sitemap = [];
    try {
        const articles = await sql`SELECT slug, updated_at, created_at FROM articles ORDER BY date DESC`;
        articlePages = articles.map((a) => ({
            url: `${SITE_URL}/publications/${a.slug}`,
            lastModified: new Date((a.updated_at || a.created_at) as string),
            changeFrequency: "monthly" as const,
            priority: 0.7,
        }));
    } catch { /* DB not ready */ }

    return [...staticPages, ...articlePages];
}
