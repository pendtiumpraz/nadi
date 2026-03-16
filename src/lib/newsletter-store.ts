import { getDB } from "@/lib/db";

export interface NewsletterSubscriber {
    id: number;
    email: string;
    ipAddress: string;
    isActive: boolean;
    subscribedAt: string;
}

export async function getAllSubscribers(): Promise<NewsletterSubscriber[]> {
    const sql = getDB();
    const rows = await sql`SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC`;
    return rows.map(rowToSubscriber);
}

export async function getSubscriberCount(): Promise<{ total: number; active: number }> {
    const sql = getDB();
    const totalRows = await sql`SELECT COUNT(*) as count FROM newsletter_subscribers`;
    const activeRows = await sql`SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = true`;
    return {
        total: Number(totalRows[0].count),
        active: Number(activeRows[0].count),
    };
}

export async function addSubscriber(email: string, ipAddress: string): Promise<{ success: boolean; message: string }> {
    const sql = getDB();
    try {
        // Check if this IP already has a subscription
        if (ipAddress) {
            const ipExists = await sql`SELECT id, email FROM newsletter_subscribers WHERE ip_address = ${ipAddress} LIMIT 1`;
            if (ipExists.length > 0) {
                return { success: false, message: "You have already subscribed from this device." };
            }
        }

        // Check if email already exists
        const existing = await sql`SELECT id, is_active FROM newsletter_subscribers WHERE email = ${email.toLowerCase()} LIMIT 1`;
        if (existing.length > 0) {
            if (existing[0].is_active) {
                return { success: false, message: "This email is already subscribed." };
            }
            // Re-activate and update IP
            await sql`UPDATE newsletter_subscribers SET is_active = true, ip_address = ${ipAddress} WHERE email = ${email.toLowerCase()}`;
            return { success: true, message: "Welcome back! Your subscription has been reactivated." };
        }

        await sql`INSERT INTO newsletter_subscribers (email, ip_address) VALUES (${email.toLowerCase()}, ${ipAddress})`;
        return { success: true, message: "Successfully subscribed!" };
    } catch {
        return { success: false, message: "Failed to subscribe. Please try again." };
    }
}

export async function toggleSubscriber(id: number, isActive: boolean): Promise<void> {
    const sql = getDB();
    await sql`UPDATE newsletter_subscribers SET is_active = ${isActive} WHERE id = ${id}`;
}

export async function deleteSubscriber(id: number): Promise<void> {
    const sql = getDB();
    await sql`DELETE FROM newsletter_subscribers WHERE id = ${id}`;
}

function rowToSubscriber(row: Record<string, unknown>): NewsletterSubscriber {
    return {
        id: row.id as number,
        email: row.email as string,
        ipAddress: (row.ip_address as string) || "",
        isActive: row.is_active as boolean,
        subscribedAt: row.subscribed_at ? new Date(row.subscribed_at as string).toISOString() : "",
    };
}
