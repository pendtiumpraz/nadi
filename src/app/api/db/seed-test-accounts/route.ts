import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import bcrypt from "bcryptjs";

const TEST_PASSWORD = "Nadi@2025!";

// Diagnostic/recovery endpoint for the five test accounts.
//
// DEFAULT (`/api/db/seed-test-accounts`):
//   - Creates rows that don't exist (password: Nadi@2025!).
//   - Updates role+status when they've drifted.
//   - Does NOT touch existing passwords (safe default).
//
// `?reset=1` (`/api/db/seed-test-accounts?reset=1`):
//   - Also resets the password of EVERY existing test account to
//     Nadi@2025!. Use this when you've forgotten the password for one
//     of the test accounts (or someone changed it from /admin/users).
//   - This is destructive — only intended for dev/staging.
//
// Idempotent and safe to call repeatedly. Returns a per-account summary.
export async function GET(req: NextRequest) {
    const reset = req.nextUrl.searchParams.get("reset") === "1";

    const accounts = [
        { email: "admin@nadi-health.id", name: "Admin", role: "admin" },
        { email: "admin2@nadi-health.id", name: "Admin (Backup)", role: "admin" },
        { email: "reviewer@nadi-health.id", name: "Test Reviewer", role: "reviewer" },
        { email: "contributor@nadi-health.id", name: "Test Contributor", role: "contributor" },
        { email: "partner@nadi-health.id", name: "Test Partner", role: "partner" },
    ];

    interface Summary {
        email: string;
        action: "created" | "updated" | "password_reset" | "ok";
        role: string;
        status: string;
        id: number;
    }
    const summary: Summary[] = [];

    try {
        const sql = getDB();
        const hash = await bcrypt.hash(TEST_PASSWORD, 10);

        for (const a of accounts) {
            const existing = await sql`SELECT id, role, status FROM users WHERE LOWER(email) = ${a.email}`;
            if (existing.length === 0) {
                const inserted = await sql`
                    INSERT INTO users (email, name, password, role, status)
                    VALUES (${a.email}, ${a.name}, ${hash}, ${a.role}, 'active')
                    RETURNING id
                `;
                summary.push({ email: a.email, action: "created", role: a.role, status: "active", id: Number(inserted[0].id) });
                continue;
            }
            const row = existing[0];
            const id = row.id as number;
            const needsRoleStatusUpdate = row.role !== a.role || row.status !== "active";

            if (reset) {
                // Forced password reset + role/status alignment in a single UPDATE.
                await sql`
                    UPDATE users
                    SET password = ${hash}, role = ${a.role}, status = 'active'
                    WHERE id = ${id}
                `;
                summary.push({ email: a.email, action: "password_reset", role: a.role, status: "active", id });
            } else if (needsRoleStatusUpdate) {
                await sql`UPDATE users SET role = ${a.role}, status = 'active' WHERE id = ${id}`;
                summary.push({ email: a.email, action: "updated", role: a.role, status: "active", id });
            } else {
                summary.push({ email: a.email, action: "ok", role: row.role as string, status: row.status as string, id });
            }
        }

        return NextResponse.json({
            ok: true,
            password: TEST_PASSWORD,
            reset,
            summary,
            tips: reset
                ? "All test-account passwords have been reset to Nadi@2025! — try signing in again."
                : "To reset passwords too, hit /api/db/seed-test-accounts?reset=1 (destructive).",
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
    }
}
