import { getDB } from "@/lib/db";

export interface Topic {
    id: number;
    title: string;
    description: string;
    category: string;
    focusArea: string;
    status: "pending" | "published";
    articleSlug: string;
    createdAt: string;
}

export async function getAllTopics(): Promise<Topic[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM topics ORDER BY created_at DESC`;
    return rows.map(rowToTopic);
}

export async function getPendingTopics(): Promise<Topic[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM topics WHERE status = 'pending' ORDER BY created_at DESC`;
    return rows.map(rowToTopic);
}

export async function saveTopics(topics: { title: string; description: string; category: string }[], focusArea: string): Promise<Topic[]> {
    const sql = getDB();
    const saved: Topic[] = [];
    for (const t of topics) {
        const rows = await sql`
      INSERT INTO topics (title, description, category, focus_area, status)
      VALUES (${t.title}, ${t.description}, ${t.category}, ${focusArea}, 'pending')
      RETURNING *
    `;
        saved.push(rowToTopic(rows[0]));
    }
    return saved;
}

export async function markTopicPublished(topicId: number, articleSlug: string): Promise<void> {
    const sql = getDB();
    await sql`UPDATE topics SET status = 'published', article_slug = ${articleSlug} WHERE id = ${topicId}`;
}

export async function deleteTopic(id: number): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM topics WHERE id = ${id}`;
}

function rowToTopic(row: Record<string, unknown>): Topic {
    return {
        id: row.id as number,
        title: row.title as string,
        description: (row.description as string) || "",
        category: (row.category as string) || "",
        focusArea: (row.focus_area as string) || "",
        status: (row.status as "pending" | "published") || "pending",
        articleSlug: (row.article_slug as string) || "",
        createdAt: (row.created_at as string) || new Date().toISOString(),
    };
}
