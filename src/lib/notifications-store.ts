import { getDB } from "@/lib/db";

export type NotificationType =
    | "article_submitted"
    | "article_resubmitted"
    | "article_changes_requested"
    | "article_approved"
    | "article_published"
    | "consent_received"
    | "comment_posted"
    | "user_signup"
    | "system";

export interface NotificationRow {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    body: string;
    link: string;
    is_read: boolean;
    created_at: string | Date;
}

export interface NotificationDTO {
    id: number;
    type: NotificationType;
    title: string;
    body: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

function rowToDTO(row: NotificationRow): NotificationDTO {
    return {
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        link: row.link,
        isRead: row.is_read,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
}

interface CreateInput {
    userId: number;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
}

/** Insert one notification row. Safe to await from inside route handlers. */
export async function createNotification(input: CreateInput): Promise<void> {
    if (!input.userId) return;
    const sql = getDB();
    await sql`
        INSERT INTO notifications (user_id, type, title, body, link)
        VALUES (${input.userId}, ${input.type}, ${input.title}, ${input.body || ""}, ${input.link || ""})
    `;
}

/** Fan-out: same notification to many users. Skips empty list. */
export async function createNotificationForUsers(userIds: number[], input: Omit<CreateInput, "userId">): Promise<void> {
    const ids = [...new Set(userIds.filter((n) => Number.isFinite(n) && n > 0))];
    if (ids.length === 0) return;
    const sql = getDB();
    // Sequential inserts — list is small (handful of admins/reviewers), no need
    // for a bulk INSERT with array binding.
    for (const id of ids) {
        await sql`
            INSERT INTO notifications (user_id, type, title, body, link)
            VALUES (${id}, ${input.type}, ${input.title}, ${input.body || ""}, ${input.link || ""})
        `;
    }
}

export async function getUserIdsByRole(role: "admin" | "reviewer" | "contributor" | "partner"): Promise<number[]> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT id FROM users WHERE role = ${role} AND status = 'active'`;
        return rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));
    } catch {
        return [];
    }
}

export async function listNotifications(userId: number, limit = 20): Promise<NotificationDTO[]> {
    const sql = getDB();
    const rows = (await sql`
        SELECT * FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `) as unknown as NotificationRow[];
    return rows.map(rowToDTO);
}

export async function countUnread(userId: number): Promise<number> {
    const sql = getDB();
    const rows = (await sql`SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = ${userId} AND is_read = false`) as { n: number }[];
    return rows[0]?.n ?? 0;
}

export async function markRead(userId: number, id: number): Promise<void> {
    const sql = getDB();
    await sql`UPDATE notifications SET is_read = true WHERE id = ${id} AND user_id = ${userId}`;
}

export async function markAllRead(userId: number): Promise<void> {
    const sql = getDB();
    await sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId} AND is_read = false`;
}
