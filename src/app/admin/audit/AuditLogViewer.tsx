"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// TODO: CSV export — defer. Plan: add an "Export CSV" button that hits
// /api/admin/audit?format=csv with the current filter range, streams a
// file from the server, and triggers a browser download.

type AuditSource = "user_event" | "submission" | "ai_call" | "login_attempt";
type FilterKey = "all" | AuditSource;

interface ActorRef {
    id: string | null;
    name: string;
    email: string;
}

interface AuditRow {
    id: string;
    source: AuditSource;
    when: string;
    type: string;
    actor: ActorRef;
    target?: string;
    detail: string;
}

interface AuditResponse {
    rows: AuditRow[];
    counts: {
        user_events: number;
        submissions: number;
        ai_calls: number;
        login_attempts: number;
    };
    total: number;
}

const PAGE_SIZE = 50;

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "user_event", label: "User events" },
    { key: "submission", label: "Submissions" },
    { key: "ai_call", label: "AI calls" },
    { key: "login_attempt", label: "Login attempts" },
];

function toDateInputValue(d: Date): string {
    // YYYY-MM-DD in local time, suitable for <input type="date">.
    const tzOffsetMs = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function defaultRange(): { since: string; until: string } {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { since: toDateInputValue(sevenDaysAgo), until: toDateInputValue(now) };
}

function formatWhen(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function sourceBadgeStyle(source: AuditSource): React.CSSProperties {
    const palette: Record<AuditSource, { bg: string; fg: string }> = {
        user_event: { bg: "rgba(40,90,180,0.12)", fg: "#1e4f9c" },
        submission: { bg: "rgba(40,140,80,0.12)", fg: "#1a7a3e" },
        ai_call: { bg: "rgba(140,60,180,0.12)", fg: "#6a2a9a" },
        login_attempt: { bg: "rgba(220,150,40,0.15)", fg: "#9a6a10" },
    };
    const { bg, fg } = palette[source];
    return {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: bg,
        color: fg,
    };
}

export default function AuditLogViewer() {
    const initialRange = useMemo(defaultRange, []);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [since, setSince] = useState(initialRange.since);
    const [until, setUntil] = useState(initialRange.until);
    const [page, setPage] = useState(1);

    const [data, setData] = useState<AuditResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            // Convert local-date inputs to ISO at start/end of day so the server
            // gets a proper inclusive range regardless of timezone.
            const sinceIso = new Date(`${since}T00:00:00`).toISOString();
            const untilIso = new Date(`${until}T23:59:59.999`).toISOString();
            const params = new URLSearchParams({
                type: filter,
                since: sinceIso,
                until: untilIso,
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            const res = await fetch(`/api/admin/audit?${params.toString()}`);
            const json = (await res.json()) as AuditResponse | { error: string };
            if (!res.ok) throw new Error("error" in json ? json.error : "Failed to load");
            setData(json as AuditResponse);
        } catch (e) {
            setErr((e as Error).message);
            setData(null);
        }
        setLoading(false);
    }, [filter, since, until, page]);

    useEffect(() => { load(); }, [load]);

    // Filter / date changes always reset to page 1 (avoids stale page numbers
    // pointing past the new total).
    const onFilter = (key: FilterKey) => { setFilter(key); setPage(1); };
    const onSince = (v: string) => { setSince(v); setPage(1); };
    const onUntil = (v: string) => { setUntil(v); setPage(1); };

    const counts = data?.counts;
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const chipCount = (key: FilterKey): number => {
        if (!counts) return 0;
        switch (key) {
            case "all": return counts.user_events + counts.submissions + counts.ai_calls + counts.login_attempts;
            case "user_event": return counts.user_events;
            case "submission": return counts.submissions;
            case "ai_call": return counts.ai_calls;
            case "login_attempt": return counts.login_attempts;
        }
    };

    return (
        <div>
            {err && (
                <div className="admin-msg" onClick={() => setErr("")}>
                    {err}
                </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {FILTER_LABELS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => onFilter(f.key)}
                            className={filter === f.key ? "btn-primary" : "btn-outline"}
                            style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                        >
                            {f.label} ({chipCount(f.key)})
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="audit-since" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>From</label>
                    <input
                        type="date"
                        id="audit-since"
                        value={since}
                        max={until}
                        onChange={(e) => onSince(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="audit-until" style={{ fontSize: "0.75rem", color: "var(--muted)" }}>To</label>
                    <input
                        type="date"
                        id="audit-until"
                        value={until}
                        min={since}
                        onChange={(e) => onUntil(e.target.value)}
                    />
                </div>
                <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.8rem" }}>
                    {loading ? "Loading..." : `${total} event${total === 1 ? "" : "s"} in range`}
                </div>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ whiteSpace: "nowrap" }}>When</th>
                        <th>Type</th>
                        <th>Actor</th>
                        <th>Target</th>
                        <th>Detail</th>
                    </tr>
                </thead>
                <tbody>
                    {(data?.rows ?? []).map((row) => (
                        <tr key={row.id}>
                            <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--muted)" }}>
                                {formatWhen(row.when)}
                            </td>
                            <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <span style={sourceBadgeStyle(row.source)}>{row.source.replace("_", " ")}</span>
                                    <span style={{ fontSize: "0.78rem" }}>{row.type}</span>
                                </div>
                            </td>
                            <td>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{row.actor.name}</span>
                                    {row.actor.email && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{row.actor.email}</span>
                                    )}
                                </div>
                            </td>
                            <td style={{ fontSize: "0.82rem" }}>{row.target || "—"}</td>
                            <td style={{ fontSize: "0.82rem" }}>{row.detail}</td>
                        </tr>
                    ))}
                    {!loading && (data?.rows.length ?? 0) === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                                No events match these filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {total > PAGE_SIZE && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", marginTop: "1.5rem" }}>
                    <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        ← Prev
                    </button>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
