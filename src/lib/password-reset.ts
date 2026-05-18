import { randomBytes, createHash } from "crypto";
import { getDB } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateToken(): string {
    return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/** Insert a new reset token row. Returns the plaintext token (for the email). */
export async function createResetToken(userId: number): Promise<string> {
    const token = generateToken();
    const hash = hashToken(token);
    const expires = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    const sql = getDB();
    // Invalidate any prior unused tokens for this user so a stale email can't
    // be replayed after a fresh request.
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ${userId} AND used_at IS NULL`;
    await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userId}, ${hash}, ${expires})
    `;
    return token;
}

export interface VerifyResult {
    ok: boolean;
    userId?: number;
    reason?: "invalid" | "expired" | "used";
}

/** Verify a plaintext token. Does NOT mark it used. */
export async function verifyResetToken(token: string): Promise<VerifyResult> {
    if (!token || typeof token !== "string") return { ok: false, reason: "invalid" };
    const hash = hashToken(token);
    const sql = getDB();
    const rows = (await sql`
        SELECT user_id, expires_at, used_at FROM password_reset_tokens
        WHERE token_hash = ${hash}
        LIMIT 1
    `) as { user_id: number; expires_at: string | Date; used_at: string | Date | null }[];
    const row = rows[0];
    if (!row) return { ok: false, reason: "invalid" };
    if (row.used_at) return { ok: false, reason: "used" };
    const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
    if (expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
    return { ok: true, userId: Number(row.user_id) };
}

/** Mark a token consumed. Call after the password update succeeds. */
export async function consumeResetToken(token: string): Promise<void> {
    const hash = hashToken(token);
    const sql = getDB();
    await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ${hash} AND used_at IS NULL`;
}
