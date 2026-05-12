import { getDB } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════
// AI usage limits — anti-abuse for the DeepSeek bridge
// ────────────────────────────────────────────────────────────────────
// Three knobs, all configurable in /admin/settings via
// `site_settings.ai_limits`:
//
//   {
//     "maxInputChars":   8000,   // reject any user prompt longer than this
//     "maxOutputTokens": 4096,   // forwarded to DeepSeek as max_tokens
//     "perUserPerHour":   30,    // rolling cap on AI calls per signed-in user
//   }
//
// Without these, a malicious or buggy client can ask the model to
// "write an article of 10,000,000 words" and burn the API quota.
// ════════════════════════════════════════════════════════════════════

export interface AiLimits {
    maxInputChars: number;
    maxOutputTokens: number;
    perUserPerHour: number;
}

const DEFAULT_LIMITS: AiLimits = {
    maxInputChars: 8000,
    maxOutputTokens: 4096,
    perUserPerHour: 30,
};

export async function getAiLimits(): Promise<AiLimits> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'ai_limits'`;
        if (rows.length === 0) return DEFAULT_LIMITS;
        const parsed = JSON.parse(rows[0].value as string) as Partial<AiLimits>;
        return {
            maxInputChars: Number(parsed.maxInputChars) > 0 ? Number(parsed.maxInputChars) : DEFAULT_LIMITS.maxInputChars,
            maxOutputTokens: Number(parsed.maxOutputTokens) > 0 ? Number(parsed.maxOutputTokens) : DEFAULT_LIMITS.maxOutputTokens,
            perUserPerHour: Number(parsed.perUserPerHour) >= 0 ? Number(parsed.perUserPerHour) : DEFAULT_LIMITS.perUserPerHour,
        };
    } catch {
        return DEFAULT_LIMITS;
    }
}

export async function setAiLimits(limits: AiLimits): Promise<void> {
    const sql = getDB();
    await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('ai_limits', ${JSON.stringify(limits)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
}

export async function recordAiCall(userId: string | null, endpoint: string, inputChars: number): Promise<void> {
    try {
        const sql = getDB();
        await sql`
            INSERT INTO ai_calls (user_id, endpoint, input_chars)
            VALUES (${userId ? Number(userId) : null}, ${endpoint}, ${inputChars})
        `;
    } catch {
        // Log failure must not block AI calls.
    }
}

export interface AiCheckResult {
    ok: boolean;
    error?: string;
    /** When ok=true, the maxOutputTokens this caller should pass to DeepSeek. */
    maxOutputTokens?: number;
}

/**
 * Validate an AI call BEFORE invoking DeepSeek. Returns ok=false with a
 * human-readable error to be returned as a 400/429 to the client. Caller
 * is responsible for invoking `recordAiCall(...)` AFTER a successful
 * DeepSeek response (or rejected validation, doesn't matter — only successful
 * calls count toward the rate limit, by design).
 */
export async function checkAiCall(userId: string | null, inputText: string): Promise<AiCheckResult> {
    const limits = await getAiLimits();

    // 1. Input size cap — defense against the "write me 10 million lines" attack
    if (inputText.length > limits.maxInputChars) {
        return {
            ok: false,
            error: `Input too long (${inputText.length} chars, max ${limits.maxInputChars}). Trim your prompt and try again.`,
        };
    }

    // 2. Per-user rate limit — only enforced for signed-in users (anonymous
    //    AI access is already blocked at the route level by auth gate).
    if (userId && limits.perUserPerHour > 0) {
        try {
            const sql = getDB();
            const since = new Date(Date.now() - 3600 * 1000).toISOString();
            const rows = await sql`SELECT COUNT(*) as n FROM ai_calls WHERE user_id = ${Number(userId)} AND called_at >= ${since}`;
            const recent = Number(rows[0]?.n ?? 0);
            if (recent >= limits.perUserPerHour) {
                return {
                    ok: false,
                    error: `Rate limit reached (${recent}/${limits.perUserPerHour} AI calls in the last hour). Try again later.`,
                };
            }
        } catch {
            // Fail-open — better to allow than to break AI on a DB hiccup.
        }
    }

    return { ok: true, maxOutputTokens: limits.maxOutputTokens };
}
