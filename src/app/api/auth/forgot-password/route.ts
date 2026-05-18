import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/users";
import { createResetToken } from "@/lib/password-reset";
import { notifyPasswordResetRequest } from "@/lib/notify";

// POST /api/auth/forgot-password { email }
// Always returns 200 OK to prevent account enumeration. If the email matches
// an active user, fires a reset email; otherwise silently no-ops.
export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json().catch(() => ({}));
        if (!email || typeof email !== "string") {
            return NextResponse.json({ ok: true });
        }

        const user = await getUserByEmail(email);
        // Don't leak whether the email is registered. Only act if active.
        if (user && user.status === "active") {
            const token = await createResetToken(Number(user.id));
            const baseUrl =
                req.nextUrl?.origin ||
                `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
            const resetUrl = `${baseUrl}/reset-password/${encodeURIComponent(token)}`;
            notifyPasswordResetRequest({ name: user.name, email: user.email, resetUrl }).catch(() => { });
        }

        return NextResponse.json({ ok: true });
    } catch {
        // Still return ok to avoid surfacing internal errors that would help enumeration.
        return NextResponse.json({ ok: true });
    }
}
