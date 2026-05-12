import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-shot endpoint to (re)seed the five test accounts.
// Idempotent: only inserts an account when its email doesn't exist.
// If the row exists but has a different role/status, it is UPDATED so the
// test accounts always end up in the documented state (role correct, status='active').
//
// Useful when /api/db/migrate ran BEFORE the multi-role seed code was added,
// or when an admin accidentally changed a test account's status.
//
// Returns a summary so you can verify each account.
export async function GET() {
    const accounts = [
        { email: "admin@nadi-health.id", name: "Admin", role: "admin" },
        { email: "admin2@nadi-health.id", name: "Admin (Backup)", role: "admin" },
        { email: "reviewer@nadi-health.id", name: "Test Reviewer", role: "reviewer" },
        { email: "contributor@nadi-health.id", name: "Test Contributor", role: "contributor" },
        { email: "partner@nadi-health.id", name: "Test Partner", role: "partner" },
    ];

    const summary: { email: string; action: "created" | "updated" | "ok"; role: string; status: string }[] = [];

    try {
        const sql = getDB();
        const hash = await bcrypt.hash("Nadi@2025!", 10);

        for (const a of accounts) {
            const existing = await sql`SELECT id, role, status FROM users WHERE LOWER(email) = ${a.email}`;
            if (existing.length === 0) {
                await sql`
                    INSERT INTO users (email, name, password, role, status)
                    VALUES (${a.email}, ${a.name}, ${hash}, ${a.role}, 'active')
                `;
                summary.push({ email: a.email, action: "created", role: a.role, status: "active" });
            } else {
                const row = existing[0];
                const needsUpdate = row.role !== a.role || row.status !== "active";
                if (needsUpdate) {
                    await sql`UPDATE users SET role = ${a.role}, status = 'active' WHERE id = ${row.id as number}`;
                    summary.push({ email: a.email, action: "updated", role: a.role, status: "active" });
                } else {
                    summary.push({ email: a.email, action: "ok", role: row.role as string, status: row.status as string });
                }
            }
        }

        return NextResponse.json({
            ok: true,
            password: "Nadi@2025!",
            summary,
            note: "Password is reset only when an account is CREATED. To reset an existing account's password, use /admin/users → Change Password.",
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
    }
}
