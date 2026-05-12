import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getThrottleSettings, setThrottleSettings, type ThrottleSettings } from "@/lib/login-throttle";
import { getDB } from "@/lib/db";

// GET — return current throttle settings + recent failed login summary.
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    const settings = await getThrottleSettings();

    // Lightweight stats: total failures in last 24h + currently-blocked emails (count only).
    let recentFailures = 0;
    try {
        const sql = getDB();
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const rows = await sql`SELECT COUNT(*) as n FROM login_attempts WHERE attempted_at >= ${since} AND success = false`;
        recentFailures = Number(rows[0]?.n ?? 0);
    } catch { /* ignore */ }

    return NextResponse.json({ settings, recentFailures });
}

// PUT — update throttle settings. Admin only.
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    try {
        const body = await req.json();
        const settings = body.settings as ThrottleSettings;
        if (!settings || typeof settings.windowSeconds !== "number" || !Array.isArray(settings.thresholds)) {
            return NextResponse.json({ error: "Invalid settings shape" }, { status: 400 });
        }
        // Validate each threshold
        for (const t of settings.thresholds) {
            if (typeof t.after !== "number" || typeof t.lockoutSeconds !== "number" || t.after < 1 || t.lockoutSeconds < 1) {
                return NextResponse.json({ error: "Each threshold needs after≥1 and lockoutSeconds≥1." }, { status: 400 });
            }
        }
        await setThrottleSettings(settings);
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
