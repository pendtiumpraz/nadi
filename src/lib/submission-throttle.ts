import { getDB } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════
// Per-user submission cap — anti-spam for partner / contributor submits
// ────────────────────────────────────────────────────────────────────
// Without this, a partner can POST /api/articles with submit:true (or
// hit the transition endpoint) an unlimited number of times per day,
// flooding the review queue and the notification CC list.
//
// Configured in /admin/settings via `site_settings.submission_limits`:
//
//   { "perDayPerUser": 5 }
//
// Counts rows in the existing `submissions` audit table where
// type='article' and the row was created since today's UTC midnight.
// Admins / reviewers (publishers) are exempt — only callers for whom
// canPublish(user) is false are checked.
// ════════════════════════════════════════════════════════════════════

export interface SubmissionLimits {
    perDayPerUser: number;
}

const DEFAULT_LIMITS: SubmissionLimits = {
    perDayPerUser: 5,
};

export async function getSubmissionLimits(): Promise<SubmissionLimits> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'submission_limits'`;
        if (rows.length === 0) return DEFAULT_LIMITS;
        const parsed = JSON.parse(rows[0].value as string) as Partial<SubmissionLimits>;
        return {
            perDayPerUser:
                Number(parsed.perDayPerUser) > 0
                    ? Number(parsed.perDayPerUser)
                    : DEFAULT_LIMITS.perDayPerUser,
        };
    } catch {
        return DEFAULT_LIMITS;
    }
}

export async function setSubmissionLimits(limits: SubmissionLimits): Promise<void> {
    const sql = getDB();
    await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('submission_limits', ${JSON.stringify(limits)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
}

export interface SubmissionCheckResult {
    ok: boolean;
    error?: string;
    /** When ok=true, how many more submits the caller has left today. */
    remaining?: number;
}

/**
 * Counts today's article submissions for the given user and returns whether
 * another submit is allowed. Caller MUST only invoke this for non-publisher
 * users (admin/reviewer are exempt). Fails open on DB errors so a transient
 * outage doesn't block legitimate work.
 */
export async function checkSubmissionAllowed(
    userId: string | number | null | undefined
): Promise<SubmissionCheckResult> {
    if (!userId) return { ok: true };

    const limits = await getSubmissionLimits();
    if (limits.perDayPerUser <= 0) return { ok: true };

    try {
        const sql = getDB();
        // Today's UTC start. We use UTC (not local time) so the cap is
        // unambiguous regardless of where the partner happens to be.
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const since = startOfDay.toISOString();

        const rows = await sql`
            SELECT COUNT(*) AS n
            FROM submissions
            WHERE author_id = ${Number(userId)}
              AND type = 'article'
              AND created_at >= ${since}
        `;
        const count = Number(rows[0]?.n ?? 0);

        if (count >= limits.perDayPerUser) {
            return {
                ok: false,
                error: `You have reached today's submission limit (${limits.perDayPerUser}). Try again tomorrow.`,
            };
        }
        return { ok: true, remaining: limits.perDayPerUser - count };
    } catch {
        // Fail-open: better to let a real submit through than break the whole
        // partner workflow on a DB hiccup.
        return { ok: true };
    }
}
