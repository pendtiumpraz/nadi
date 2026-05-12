import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { getDB } from "@/lib/db";

// Source labels used both server-side (filtering) and client-side (chips).
export type AuditSource = "user_event" | "submission" | "ai_call" | "login_attempt";

interface ActorRef {
    id: string | null;
    name: string;
    email: string;
}

interface AuditRow {
    id: string;            // unique across sources, e.g. "user_event:42"
    source: AuditSource;
    when: string;          // ISO timestamp
    type: string;          // human-readable event name
    actor: ActorRef;
    target?: string;       // free-form: user email, content slug, etc.
    detail: string;        // type-specific human-readable detail
}

interface Counts {
    user_events: number;
    submissions: number;
    ai_calls: number;
    login_attempts: number;
}

const SOURCE_VALUES: AuditSource[] = ["user_event", "submission", "ai_call", "login_attempt"];

function parseDateParam(value: string | null, fallback: Date): Date {
    if (!value) return fallback;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? fallback : d;
}

function makeActor(id: number | string | null | undefined, name: string | null | undefined, email: string | null | undefined): ActorRef {
    return {
        id: id == null ? null : String(id),
        name: (name as string) || (email as string) || (id != null ? `#${id}` : "—"),
        email: (email as string) || "",
    };
}

function safeJson(value: unknown): Record<string, unknown> {
    if (value == null) return {};
    if (typeof value === "object") return value as Record<string, unknown>;
    if (typeof value === "string") {
        try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
    }
    return {};
}

function describeUserEvent(action: string, meta: Record<string, unknown>): string {
    if (action === "role_changed") {
        const role = meta.role ? String(meta.role) : "?";
        return `Role changed to ${role}`;
    }
    if (action === "created") {
        const role = meta.role ? String(meta.role) : "?";
        const status = meta.status ? String(meta.status) : "?";
        return `Account created (role=${role}, status=${status})`;
    }
    if (action === "deleted") return "Account deleted";
    if (action.startsWith("status_")) {
        return `Status set to ${action.slice("status_".length)}`;
    }
    if (action === "password_changed") return "Password changed";
    // Fallback: show action + any small meta keys
    const extras = Object.keys(meta).length ? ` (${JSON.stringify(meta)})` : "";
    return `${action}${extras}`;
}

function describeSubmission(type: string, status: string, notes: string): string {
    const base = `${type} → ${status}`;
    if (notes && notes.trim()) {
        const trimmed = notes.length > 120 ? `${notes.slice(0, 117)}...` : notes;
        return `${base} — ${trimmed}`;
    }
    return base;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canManageUsers(session.user)) return NextResponse.json({ error: "Admin role required" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") || "all";
    const type: AuditSource | "all" = (SOURCE_VALUES as string[]).includes(typeParam) ? (typeParam as AuditSource) : "all";

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since = parseDateParam(searchParams.get("since"), sevenDaysAgo);
    const until = parseDateParam(searchParams.get("until"), now);
    const sinceIso = since.toISOString();
    const untilIso = until.toISOString();

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

    const sql = getDB();

    // ── Counts (all four sources, always returned for the chip badges) ──
    // These are intentionally cheap COUNT(*) queries scoped by date range.
    const [ueCountRows, subCountRows, aiCountRows, loginCountRows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS n FROM user_events WHERE created_at >= ${sinceIso} AND created_at <= ${untilIso}`,
        sql`SELECT COUNT(*)::int AS n FROM submissions WHERE created_at >= ${sinceIso} AND created_at <= ${untilIso}`,
        sql`SELECT COUNT(*)::int AS n FROM ai_calls WHERE called_at >= ${sinceIso} AND called_at <= ${untilIso}`,
        sql`SELECT COUNT(*)::int AS n FROM login_attempts WHERE attempted_at >= ${sinceIso} AND attempted_at <= ${untilIso}`,
    ]);

    const counts: Counts = {
        user_events: Number(ueCountRows[0]?.n ?? 0),
        submissions: Number(subCountRows[0]?.n ?? 0),
        ai_calls: Number(aiCountRows[0]?.n ?? 0),
        login_attempts: Number(loginCountRows[0]?.n ?? 0),
    };

    // ── Pull rows from each requested source. Each query JOINs users to ──
    // resolve actor / target IDs to email + name in a single round-trip.
    const includeUE = type === "all" || type === "user_event";
    const includeSub = type === "all" || type === "submission";
    const includeAI = type === "all" || type === "ai_call";
    const includeLogin = type === "all" || type === "login_attempt";

    // Cap each per-source pull so a single noisy table can't starve the others.
    // We then merge + sort + paginate in memory across all four sources.
    const PER_SOURCE_CAP = 500;

    const [ueRows, subRows, aiRows, loginRows] = await Promise.all([
        includeUE
            ? sql`
                SELECT ue.id, ue.actor_id, ue.target_user_id, ue.action, ue.meta, ue.created_at,
                       a.email AS actor_email, a.name AS actor_name,
                       t.email AS target_email, t.name AS target_name
                FROM user_events ue
                LEFT JOIN users a ON a.id = ue.actor_id
                LEFT JOIN users t ON t.id = ue.target_user_id
                WHERE ue.created_at >= ${sinceIso} AND ue.created_at <= ${untilIso}
                ORDER BY ue.created_at DESC
                LIMIT ${PER_SOURCE_CAP}
            `
            : Promise.resolve([] as Record<string, unknown>[]),
        includeSub
            ? sql`
                SELECT s.id, s.type, s.ref_slug, s.author_id, s.reviewer_id, s.status, s.notes, s.created_at,
                       au.email AS author_email, au.name AS author_name,
                       rv.email AS reviewer_email, rv.name AS reviewer_name
                FROM submissions s
                LEFT JOIN users au ON au.id = s.author_id
                LEFT JOIN users rv ON rv.id = s.reviewer_id
                WHERE s.created_at >= ${sinceIso} AND s.created_at <= ${untilIso}
                ORDER BY s.created_at DESC
                LIMIT ${PER_SOURCE_CAP}
            `
            : Promise.resolve([] as Record<string, unknown>[]),
        includeAI
            ? sql`
                SELECT ac.id, ac.user_id, ac.endpoint, ac.input_chars, ac.called_at,
                       u.email AS user_email, u.name AS user_name
                FROM ai_calls ac
                LEFT JOIN users u ON u.id = ac.user_id
                WHERE ac.called_at >= ${sinceIso} AND ac.called_at <= ${untilIso}
                ORDER BY ac.called_at DESC
                LIMIT ${PER_SOURCE_CAP}
            `
            : Promise.resolve([] as Record<string, unknown>[]),
        includeLogin
            ? sql`
                SELECT la.id, la.email, la.ip_address, la.success, la.attempted_at,
                       u.id AS user_id, u.name AS user_name
                FROM login_attempts la
                LEFT JOIN users u ON LOWER(u.email) = LOWER(la.email)
                WHERE la.attempted_at >= ${sinceIso} AND la.attempted_at <= ${untilIso}
                ORDER BY la.attempted_at DESC
                LIMIT ${PER_SOURCE_CAP}
            `
            : Promise.resolve([] as Record<string, unknown>[]),
    ]);

    const merged: AuditRow[] = [];

    for (const r of ueRows) {
        const meta = safeJson(r.meta);
        const action = String(r.action);
        merged.push({
            id: `user_event:${r.id}`,
            source: "user_event",
            when: new Date(r.created_at as string).toISOString(),
            type: action,
            actor: makeActor(r.actor_id as number | null, r.actor_name as string | null, r.actor_email as string | null),
            target: (r.target_email as string) || (r.target_name as string) || (r.target_user_id != null ? `#${r.target_user_id}` : undefined),
            detail: describeUserEvent(action, meta),
        });
    }

    for (const r of subRows) {
        merged.push({
            id: `submission:${r.id}`,
            source: "submission",
            when: new Date(r.created_at as string).toISOString(),
            type: `submission/${r.type}`,
            actor: makeActor(r.author_id as number | null, r.author_name as string | null, r.author_email as string | null),
            target: (r.ref_slug as string) || undefined,
            detail: describeSubmission(String(r.type), String(r.status), (r.notes as string) || ""),
        });
    }

    for (const r of aiRows) {
        merged.push({
            id: `ai_call:${r.id}`,
            source: "ai_call",
            when: new Date(r.called_at as string).toISOString(),
            type: `ai/${r.endpoint}`,
            actor: makeActor(r.user_id as number | null, r.user_name as string | null, r.user_email as string | null),
            target: undefined,
            detail: `${r.input_chars} input chars`,
        });
    }

    for (const r of loginRows) {
        const success = Boolean(r.success);
        merged.push({
            id: `login_attempt:${r.id}`,
            source: "login_attempt",
            when: new Date(r.attempted_at as string).toISOString(),
            type: success ? "login/success" : "login/failure",
            actor: makeActor(r.user_id as number | null, r.user_name as string | null, r.email as string | null),
            target: undefined,
            detail: `${success ? "Success" : "Failure"} from ${(r.ip_address as string) || "unknown IP"}`,
        });
    }

    merged.sort((a, b) => (a.when < b.when ? 1 : a.when > b.when ? -1 : 0));

    const total = merged.length;
    const start = (page - 1) * limit;
    const rows = merged.slice(start, start + limit);

    return NextResponse.json({ rows, counts, total });
}
