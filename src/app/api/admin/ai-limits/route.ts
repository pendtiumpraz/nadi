import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getAiLimits, setAiLimits, type AiLimits } from "@/lib/ai-throttle";
import { getDB } from "@/lib/db";

// GET — current limits + last-24h usage stats. Admin only.
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    const limits = await getAiLimits();

    let last24h = 0;
    let topUsers: { userId: number | null; calls: number }[] = [];
    try {
        const sql = getDB();
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const total = await sql`SELECT COUNT(*) as n FROM ai_calls WHERE called_at >= ${since}`;
        last24h = Number(total[0]?.n ?? 0);
        const top = await sql`
            SELECT user_id, COUNT(*) as n
            FROM ai_calls
            WHERE called_at >= ${since}
            GROUP BY user_id
            ORDER BY n DESC
            LIMIT 5
        `;
        topUsers = top.map((r) => ({ userId: r.user_id as number | null, calls: Number(r.n) }));
    } catch { /* ignore */ }

    return NextResponse.json({ limits, last24h, topUsers });
}

// PUT — update limits. Admin only.
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    try {
        const body = await req.json();
        const limits = body.limits as AiLimits;
        if (!limits) return NextResponse.json({ error: "Body must include `limits`." }, { status: 400 });
        // Sanity-clamp the values so an admin typo can't disable defenses entirely.
        const clamped: AiLimits = {
            maxInputChars: Math.min(Math.max(500, Number(limits.maxInputChars) || 8000), 50_000),
            maxOutputTokens: Math.min(Math.max(64, Number(limits.maxOutputTokens) || 4096), 8000),
            perUserPerHour: Math.min(Math.max(0, Number(limits.perUserPerHour) || 30), 1000),
        };
        await setAiLimits(clamped);
        return NextResponse.json({ ok: true, limits: clamped });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
