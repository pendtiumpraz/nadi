import { getDB } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════
// Login attempt throttling
// ────────────────────────────────────────────────────────────────────
// Tracks failed sign-in attempts per email address. Escalating lockouts
// are configurable in /admin/settings via `site_settings.security_throttle`:
//
//   {
//     "windowSeconds": 3600,           // how far back to count failures
//     "thresholds": [
//       { "after": 3,  "lockoutSeconds": 30 },
//       { "after": 5,  "lockoutSeconds": 300 },
//       { "after": 10, "lockoutSeconds": 3600 }
//     ]
//   }
//
// On a check, the highest-N threshold the user has met wins. The user is
// blocked if the lockout-window since their most recent failure has not
// yet elapsed.
// ════════════════════════════════════════════════════════════════════

export interface ThrottleThreshold {
    after: number;
    lockoutSeconds: number;
}

export interface ThrottleSettings {
    windowSeconds: number;
    thresholds: ThrottleThreshold[];
}

const DEFAULT_SETTINGS: ThrottleSettings = {
    windowSeconds: 3600,
    thresholds: [
        { after: 3, lockoutSeconds: 30 },
        { after: 5, lockoutSeconds: 300 },
        { after: 10, lockoutSeconds: 3600 },
    ],
};

export async function getThrottleSettings(): Promise<ThrottleSettings> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'security_throttle'`;
        if (rows.length === 0) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(rows[0].value as string) as ThrottleSettings;
        if (!Array.isArray(parsed.thresholds) || typeof parsed.windowSeconds !== "number") {
            return DEFAULT_SETTINGS;
        }
        return parsed;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function setThrottleSettings(settings: ThrottleSettings): Promise<void> {
    const sql = getDB();
    await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('security_throttle', ${JSON.stringify(settings)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
}

export async function recordLoginAttempt(email: string, success: boolean, ip: string = ""): Promise<void> {
    try {
        const sql = getDB();
        await sql`
            INSERT INTO login_attempts (email, ip_address, success)
            VALUES (${email.toLowerCase()}, ${ip}, ${success})
        `;
    } catch {
        // Don't block sign-in on a logging failure.
    }
}

export interface ThrottleStatus {
    blocked: boolean;
    retryAfterSeconds: number;
    recentFailures: number;
}

/**
 * Returns whether the given email is currently locked out, and if so for
 * how many seconds. Called BEFORE password verification so the user gets
 * the same response shape whether they typed a real address or not.
 */
export async function checkLoginThrottle(email: string): Promise<ThrottleStatus> {
    const settings = await getThrottleSettings();
    if (!settings.thresholds.length) return { blocked: false, retryAfterSeconds: 0, recentFailures: 0 };

    try {
        const sql = getDB();
        const cutoff = new Date(Date.now() - settings.windowSeconds * 1000).toISOString();
        // Failures since cutoff, ordered most recent first. Successful sign-in
        // clears the counter — we treat any success after a failure as a reset.
        const rows = await sql`
            SELECT success, attempted_at
            FROM login_attempts
            WHERE email = ${email.toLowerCase()} AND attempted_at >= ${cutoff}
            ORDER BY attempted_at DESC
        `;
        let failures = 0;
        let lastFailure: Date | null = null;
        for (const r of rows) {
            if (r.success) break; // recent success resets the chain
            failures += 1;
            if (!lastFailure) lastFailure = new Date(r.attempted_at as string);
        }
        if (failures === 0 || !lastFailure) return { blocked: false, retryAfterSeconds: 0, recentFailures: 0 };

        // Find the strictest threshold the user has met.
        const sorted = [...settings.thresholds].sort((a, b) => b.after - a.after);
        const match = sorted.find((t) => failures >= t.after);
        if (!match) return { blocked: false, retryAfterSeconds: 0, recentFailures: failures };

        const elapsed = (Date.now() - lastFailure.getTime()) / 1000;
        const remaining = match.lockoutSeconds - elapsed;
        if (remaining <= 0) return { blocked: false, retryAfterSeconds: 0, recentFailures: failures };
        return { blocked: true, retryAfterSeconds: Math.ceil(remaining), recentFailures: failures };
    } catch {
        // Fail-open: better to let a real user through than break sign-in entirely on a DB hiccup.
        return { blocked: false, retryAfterSeconds: 0, recentFailures: 0 };
    }
}
