"use client";

import * as React from "react";

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    body: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

interface ApiResponse {
    items: NotificationItem[];
    unread: number;
}

const POLL_INTERVAL_MS = 30_000;

function timeAgo(iso: string): string {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "";
    const diffMs = Date.now() - t;
    const s = Math.floor(diffMs / 1000);
    if (s < 30) return "just now";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString();
}

export default function NotificationBell(): React.JSX.Element {
    const [items, setItems] = React.useState<NotificationItem[]>([]);
    const [unread, setUnread] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications", { cache: "no-store" });
            if (!res.ok) return;
            const data = (await res.json()) as ApiResponse;
            setItems(data.items || []);
            setUnread(data.unread || 0);
        } catch {
            /* silent — the bell shouldn't disrupt the admin UI on transient errors */
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
        const id = window.setInterval(load, POLL_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [load]);

    // Close on outside click.
    React.useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    const onClickItem = async (n: NotificationItem) => {
        // Mark read first so the badge updates even if navigation is slow.
        if (!n.isRead) {
            setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
            setUnread((u) => Math.max(0, u - 1));
            fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => { });
        }
        if (n.link) {
            setOpen(false);
            window.location.href = n.link;
        }
    };

    const onMarkAllRead = async () => {
        setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
        setUnread(0);
        try {
            await fetch("/api/notifications/mark-all-read", { method: "POST" });
        } catch {
            /* swallow */
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: "relative" }}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
                aria-haspopup="true"
                aria-expanded={open}
                style={{
                    position: "relative",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "inherit",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "1rem",
                    lineHeight: 1,
                }}
            >
                <span aria-hidden style={{ fontFamily: "sans-serif" }}>🔔</span>
                {unread > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: 9,
                            background: "#8B1C1C",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #2C2C2C",
                        }}
                    >
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Notifications"
                    style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 360,
                        maxHeight: 480,
                        overflow: "hidden",
                        background: "#fff",
                        color: "#1a1a1a",
                        borderRadius: 8,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                        border: "1px solid #e5e5e5",
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#fafafa",
                        }}
                    >
                        <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>Notifications</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#8B1C1C",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {loading && items.length === 0 ? (
                            <p style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem", margin: 0 }}>
                                Loading…
                            </p>
                        ) : items.length === 0 ? (
                            <p style={{ padding: "1.5rem", textAlign: "center", color: "#888", fontSize: "0.85rem", margin: 0 }}>
                                No notifications yet.
                            </p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => onClickItem(n)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "12px 14px",
                                        background: n.isRead ? "transparent" : "rgba(139,28,28,0.04)",
                                        borderBottom: "1px solid #f0f0f0",
                                        border: "none",
                                        cursor: n.link ? "pointer" : "default",
                                        borderLeft: n.isRead ? "3px solid transparent" : "3px solid #8B1C1C",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: "0.85rem", color: "#1a1a1a" }}>
                                            {n.title}
                                        </span>
                                        <span style={{ fontSize: "0.7rem", color: "#888", flexShrink: 0, whiteSpace: "nowrap" }}>
                                            {timeAgo(n.createdAt)}
                                        </span>
                                    </div>
                                    {n.body && (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "0.78rem",
                                                color: "#555",
                                                lineHeight: 1.45,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                            }}
                                        >
                                            {n.body}
                                        </p>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
