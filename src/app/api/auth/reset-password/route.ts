import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken, consumeResetToken } from "@/lib/password-reset";
import { changePassword, logUserEvent } from "@/lib/users";

// GET /api/auth/reset-password?token=...
// Lightweight verify so the page can show "link expired" before the user types
// a new password. Doesn't consume the token.
export async function GET(req: NextRequest) {
    const token = new URL(req.url).searchParams.get("token") || "";
    const result = await verifyResetToken(token);
    if (!result.ok) {
        return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
}

// POST /api/auth/reset-password { token, password }
// Verifies + consumes the token + updates the password.
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json().catch(() => ({}));
        if (!token || typeof token !== "string") {
            return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
        }
        if (!password || typeof password !== "string" || password.length < 6) {
            return NextResponse.json(
                { ok: false, error: "Password must be at least 6 characters." },
                { status: 400 }
            );
        }

        const verify = await verifyResetToken(token);
        if (!verify.ok || !verify.userId) {
            const reason =
                verify.reason === "expired"
                    ? "This reset link has expired. Request a new one."
                    : verify.reason === "used"
                        ? "This reset link has already been used."
                        : "This reset link is invalid.";
            return NextResponse.json({ ok: false, error: reason }, { status: 400 });
        }

        await changePassword(String(verify.userId), password);
        await consumeResetToken(token);
        await logUserEvent(null, String(verify.userId), "password_reset_via_email");

        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
    }
}
