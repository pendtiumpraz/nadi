import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import {
    getSubmissionLimits,
    setSubmissionLimits,
    type SubmissionLimits,
} from "@/lib/submission-throttle";
import { getDB } from "@/lib/db";

// GET — current submission limits + today's top submitters. Admin only.
export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    const limits = await getSubmissionLimits();

    let todayBySubmitter: { user_id: number | null; name: string; count: number }[] = [];
    try {
        const sql = getDB();
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const since = startOfDay.toISOString();
        const rows = await sql`
            SELECT s.author_id AS user_id,
                   COALESCE(u.name, '(unknown)') AS name,
                   COUNT(*) AS n
            FROM submissions s
            LEFT JOIN users u ON u.id = s.author_id
            WHERE s.type = 'article'
              AND s.created_at >= ${since}
              AND s.author_id IS NOT NULL
            GROUP BY s.author_id, u.name
            ORDER BY n DESC
            LIMIT 10
        `;
        todayBySubmitter = rows.map((r) => ({
            user_id: r.user_id as number | null,
            name: String(r.name ?? "(unknown)"),
            count: Number(r.n),
        }));
    } catch { /* ignore — stats are best-effort */ }

    return NextResponse.json({ limits, todayBySubmitter });
}

// PUT — update limits with sanity clamp. Admin only.
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    try {
        const body = await req.json();
        const limits = body.limits as SubmissionLimits;
        if (!limits) return NextResponse.json({ error: "Body must include `limits`." }, { status: 400 });
        // Clamp to a sane band so a typo can't disable the cap (0) or set
        // an absurd value (10,000) that would make it pointless.
        const clamped: SubmissionLimits = {
            perDayPerUser: Math.min(Math.max(1, Number(limits.perDayPerUser) || 5), 100),
        };
        await setSubmissionLimits(clamped);
        return NextResponse.json({ ok: true, limits: clamped });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
