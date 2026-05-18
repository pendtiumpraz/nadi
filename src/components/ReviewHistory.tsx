"use client";

import * as React from "react";

interface HistoryEntry {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    actor: { id: string | null; name: string; role: string | null };
    reviewer: { id: string | null; name: string | null; role: string | null };
}

interface Props {
    slug: string;
}

const STATUS_LABEL: Record<string, string> = {
    in_review: "Submitted for review",
    draft: "Saved as draft",
    changes_requested: "Sent back with changes",
    approved: "Approved",
    consent_received: "Consent received",
    published: "Published",
};

const STATUS_COLOR: Record<string, { bg: string; fg: string; dot: string }> = {
    in_review: { bg: "rgba(220,150,40,0.10)", fg: "#9a6a10", dot: "#dc9628" },
    draft: { bg: "rgba(150,150,150,0.12)", fg: "#666", dot: "#999" },
    changes_requested: { bg: "rgba(196,68,68,0.10)", fg: "#a83838", dot: "#c44" },
    approved: { bg: "rgba(140,90,200,0.12)", fg: "#6a3a9a", dot: "#8c5ac8" },
    consent_received: { bg: "rgba(30,90,170,0.10)", fg: "#1d4a8a", dot: "#2a6cb8" },
    published: { bg: "rgba(40,140,80,0.10)", fg: "#1a7a3e", dot: "#28a050" },
};

function formatWhen(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function buildSentence(entry: HistoryEntry): string {
    const status = STATUS_LABEL[entry.status] ?? entry.status;
    const isReviewerAction = entry.status === "changes_requested" || entry.status === "approved" || entry.status === "published";
    if (isReviewerAction) {
        const reviewer = entry.reviewer.name || entry.actor.name;
        const author = entry.actor.name;
        if (entry.reviewer.id && entry.reviewer.id !== entry.actor.id) {
            return `${reviewer} ${status.toLowerCase()} (article by ${author}).`;
        }
        return `${reviewer} ${status.toLowerCase()}.`;
    }
    return `${entry.actor.name} ${status.toLowerCase()}.`;
}

export default function ReviewHistory({ slug }: Props): React.JSX.Element {
    const [history, setHistory] = React.useState<HistoryEntry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        let cancelled = false;
        fetch(`/api/articles/${slug}/history`)
            .then(async (res) => {
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    setError(data?.error || "Failed to load review history.");
                    return;
                }
                setHistory(Array.isArray(data.history) ? data.history : []);
            })
            .catch((err) => {
                if (!cancelled) setError((err as Error).message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (loading) {
        return (
            <section style={{ marginTop: "2rem" }}>
                <h2 style={titleStyle}>Review History</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Loading review history…</p>
            </section>
        );
    }

    if (error) {
        return (
            <section style={{ marginTop: "2rem" }}>
                <h2 style={titleStyle}>Review History</h2>
                <p style={{ color: "#a83838", fontSize: "0.85rem" }}>{error}</p>
            </section>
        );
    }

    if (history.length === 0) {
        return (
            <section style={{ marginTop: "2rem" }}>
                <h2 style={titleStyle}>Review History</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    No state transitions recorded yet. Once the article is submitted, every approval,
                    request-for-changes, and publish action will appear here with the actor + timestamp.
                </p>
            </section>
        );
    }

    return (
        <section style={{ marginTop: "2rem" }}>
            <h2 style={titleStyle}>Review History</h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
                {/* Vertical timeline line */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 7,
                        top: 12,
                        bottom: 12,
                        width: 2,
                        background: "#e5e2dc",
                    }}
                />
                {history.map((entry) => {
                    const palette = STATUS_COLOR[entry.status] ?? STATUS_COLOR.draft;
                    return (
                        <li key={entry.id} style={{ position: "relative", paddingLeft: 28, marginBottom: "1rem" }}>
                            {/* Timeline dot */}
                            <span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 1,
                                    top: 6,
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: palette.dot,
                                    border: "3px solid #fff",
                                    boxShadow: `0 0 0 1px ${palette.dot}`,
                                }}
                            />
                            <div
                                style={{
                                    background: palette.bg,
                                    border: `1px solid ${palette.fg}33`,
                                    borderLeft: `3px solid ${palette.dot}`,
                                    borderRadius: 4,
                                    padding: "0.65rem 0.9rem",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: palette.fg }}>
                                        {STATUS_LABEL[entry.status] ?? entry.status}
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                        {formatWhen(entry.createdAt)}
                                    </span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--ink, #1a1a1a)", lineHeight: 1.45 }}>
                                    {buildSentence(entry)}
                                </div>
                                {entry.notes && entry.notes.trim().length > 0 && !entry.notes.startsWith("resubmit via") && !entry.notes.startsWith("submit via") && !entry.notes.startsWith("created via") && (
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            padding: "0.5rem 0.7rem",
                                            background: "#fff",
                                            border: "1px solid #00000010",
                                            borderRadius: 3,
                                            fontSize: "0.82rem",
                                            color: "#333",
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
                                            Notes
                                        </div>
                                        {entry.notes}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

const titleStyle: React.CSSProperties = {
    fontSize: "1rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--muted)",
    marginBottom: "0.75rem",
};
