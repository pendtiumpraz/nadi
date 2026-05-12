import { getDB } from "@/lib/db";
import type { Article, ArticleStatus, PolicyProductType } from "@/data/articles/types";

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
    const status: ArticleStatus = article.status || "published";
    const authorId = article.authorId ? Number(article.authorId) : null;
    const productType = article.policyProductType || null;
    const aiDisclosure = article.aiDisclosure || "";
    const primaryResearch = !!article.containsPrimaryResearch;
    const feedbackPending = !!article.feedbackPending;
    await sql`
    INSERT INTO articles (slug, title, subtitle, category, date, read_time, author, cover_color, cover_image, pdf_url, seo_description, seo_keywords, blocks, status, author_id, policy_product_type, ai_disclosure, contains_primary_research, feedback_pending, updated_at)
    VALUES (${article.slug}, ${article.title}, ${article.subtitle || ""}, ${article.category}, ${article.date}, ${article.readTime}, ${article.author}, ${article.coverColor}, ${article.coverImage || ""}, ${article.pdfUrl || ""}, ${article.seo?.description || ""}, ${article.seo?.keywords || []}, ${JSON.stringify(article.blocks)}, ${status}, ${authorId}, ${productType}, ${aiDisclosure}, ${primaryResearch}, ${feedbackPending}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      category = EXCLUDED.category,
      date = EXCLUDED.date,
      read_time = EXCLUDED.read_time,
      author = EXCLUDED.author,
      cover_color = EXCLUDED.cover_color,
      cover_image = EXCLUDED.cover_image,
      pdf_url = EXCLUDED.pdf_url,
      seo_description = EXCLUDED.seo_description,
      seo_keywords = EXCLUDED.seo_keywords,
      blocks = EXCLUDED.blocks,
      status = EXCLUDED.status,
      policy_product_type = EXCLUDED.policy_product_type,
      ai_disclosure = EXCLUDED.ai_disclosure,
      contains_primary_research = EXCLUDED.contains_primary_research,
      feedback_pending = EXCLUDED.feedback_pending,
      updated_at = NOW()
  `;
}

export async function clearFeedbackPending(slug: string): Promise<void> {
    const sql = getDB();
    await sql`UPDATE articles SET feedback_pending = false WHERE slug = ${slug}`;
}

export async function setFeedbackPending(slug: string): Promise<void> {
    const sql = getDB();
    await sql`UPDATE articles SET feedback_pending = true WHERE slug = ${slug}`;
}

export async function setConsentReceived(slug: string, consentId: number): Promise<void> {
    const sql = getDB();
    await sql`UPDATE articles SET consent_id = ${consentId}, status = 'consent_received', updated_at = NOW() WHERE slug = ${slug}`;
}

export async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM articles WHERE author_id = ${Number(authorId)} ORDER BY date DESC`;
    return rows.map(rowToArticle);
}

export async function updateArticleStatus(slug: string, status: ArticleStatus): Promise<void> {
    const sql = getDB();
    await sql`UPDATE articles SET status = ${status}, updated_at = NOW() WHERE slug = ${slug}`;
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
        coverImage: (row.cover_image as string) || "",
        pdfUrl: (row.pdf_url as string) || "",
        seo: {
            description: (row.seo_description as string) || "",
            keywords: (row.seo_keywords as string[]) || [],
        },
        blocks: (row.blocks as Article["blocks"]) || [],
        status: (row.status as ArticleStatus) || "published",
        authorId: row.author_id != null ? String(row.author_id) : undefined,
        policyProductType: (row.policy_product_type as PolicyProductType) || undefined,
        aiDisclosure: (row.ai_disclosure as string) || "",
        containsPrimaryResearch: !!row.contains_primary_research,
        feedbackPending: !!row.feedback_pending,
    };
}
