import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import { createResetToken } from "@/lib/password-reset";
import { notifyPasswordResetRequest } from "@/lib/notify";

// POST /api/auth/forgot-password { email }
// Always returns 200 OK to prevent account enumeration. If the email matches
// a registered user (active OR pending — both should be able to recover
// access), fires a reset email. Suspended accounts are excluded so a banned
// user can't keep cycling tokens.
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json().catch(() => ({}));
        if (!email || typeof email !== "string") {
            console.info("[forgot-password] missing email in body");
            return NextResponse.json({ ok: true });
        }

        const normalizedEmail = email.trim();
        const user = await getUserByEmail(normalizedEmail);
        if (!user) {
            console.info(`[forgot-password] no user matched: ${normalizedEmail}`);
            return NextResponse.json({ ok: true });
        }
        if (user.status === "suspended") {
            console.info(`[forgot-password] suspended user attempted reset: ${user.email}`);
            return NextResponse.json({ ok: true });
        }

        const token = await createResetToken(Number(user.id));
        const baseUrl =
            req.nextUrl?.origin ||
            `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
        const resetUrl = `${baseUrl}/reset-password/${encodeURIComponent(token)}`;
        console.info(`[forgot-password] dispatching reset email to ${user.email} url=${resetUrl}`);
        // Await so any SMTP error surfaces in the server log instead of being
        // swallowed by .catch(). The response is still always-OK so anti-
        // enumeration semantics are preserved.
        try {
            await notifyPasswordResetRequest({ name: user.name, email: user.email, resetUrl });
            console.info(`[forgot-password] reset email dispatched for ${user.email}`);
        } catch (err) {
            console.error(`[forgot-password] notify failed for ${user.email}:`, (err as Error).message);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[forgot-password] handler error:", (err as Error).message);
        // Still return ok to avoid surfacing internal errors that would help enumeration.
        return NextResponse.json({ ok: true });
    }
}
