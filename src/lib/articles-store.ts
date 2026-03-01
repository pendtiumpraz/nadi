import { getDB } from "@/lib/db";
import type { Article } from "@/data/articles/types";

export async function getAllArticlesStore(): Promise<Article[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM articles ORDER BY date DESC`;
    return rows.map(rowToArticle);
}

export async function getArticleBySlugStore(slug: string): Promise<Article | null> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM articles WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) return null;
    return rowToArticle(rows[0]);
}

export async function saveArticle(article: Article): Promise<void> {
    const sql = getDB();
    await sql`
    INSERT INTO articles (slug, title, subtitle, category, date, read_time, author, cover_color, seo_description, seo_keywords, blocks, updated_at)
    VALUES (${article.slug}, ${article.title}, ${article.subtitle || ""}, ${article.category}, ${article.date}, ${article.readTime}, ${article.author}, ${article.coverColor}, ${article.seo?.description || ""}, ${article.seo?.keywords || []}, ${JSON.stringify(article.blocks)}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      category = EXCLUDED.category,
      date = EXCLUDED.date,
      read_time = EXCLUDED.read_time,
      author = EXCLUDED.author,
      cover_color = EXCLUDED.cover_color,
      seo_description = EXCLUDED.seo_description,
      seo_keywords = EXCLUDED.seo_keywords,
      blocks = EXCLUDED.blocks,
      updated_at = NOW()
  `;
}

export async function deleteArticle(slug: string): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM articles WHERE slug = ${slug}`;
}

export async function articleExists(slug: string): Promise<boolean> {
    const sql = getDB();
    const rows = await sql`SELECT 1 FROM articles WHERE slug = ${slug} LIMIT 1`;
    return rows.length > 0;
}

// Convert DB row to Article type
function rowToArticle(row: Record<string, unknown>): Article {
    return {
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
    };
}
