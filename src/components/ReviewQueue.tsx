"use client";

import { useEffect, useState, useCallback } from "react";

interface ReviewItem {
    slug: string;
    title: string;
    category?: string;
    author?: string;
    date?: string;
    type?: string;
}

interface QueueData {
    articles: ReviewItem[];
    media: ReviewItem[];
    events: ReviewItem[];
}

export default function ReviewQueue() {
    const [data, setData] = useState<QueueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actingOn, setActingOn] = useState<string | null>(null);
    const [msg, setMsg] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/review");
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            setData(d);
        } catch (err) {
            setMsg((err as Error).message);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const transitionArticle = async (slug: string, action: "approve" | "request_changes") => {
        let notes = "";
        if (action === "request_changes") {
            notes = prompt("What changes are needed? (sent back to author)") || "";
            if (!notes.trim()) return;
        }
        setActingOn(slug);
        try {
            const res = await fetch(`/api/articles/${slug}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, notes }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            setMsg(action === "approve" ? "✓ Article published" : "✓ Sent back to author");
            await load();
        } catch (err) {
            setMsg((err as Error).message);
        }
        setActingOn(null);
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading review queue...</p>;
    if (!data) return null;

    const total = data.articles.length + data.media.length + data.events.length;

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {total === 0 ? "Nothing pending review right now." : `${total} item${total === 1 ? "" : "s"} awaiting review.`}
            </p>

            {data.articles.length > 0 && (
                <section style={{ marginTop: "2rem" }}>
                    <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                        Articles ({data.articles.length})
                    </h2>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Title</th><th>Category</th><th>Author</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {data.articles.map((a) => (
                                <tr key={a.slug}>
                                    <td><a href={`/admin/articles/${a.slug}`} style={{ color: "var(--crimson)", textDecoration: "none", fontWeight: 600 }}>{a.title}</a></td>
                                    <td>{a.category}</td>
                                    <td>{a.author}</td>
                                    <td>{a.date}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button
                                                className="admin-btn"
                                                style={{ background: "#1a7a3e", color: "#fff" }}
                                                disabled={actingOn === a.slug}
                                                onClick={() => transitionArticle(a.slug, "approve")}
                                            >
                                                {actingOn === a.slug ? "..." : "Approve"}
                                            </button>
                                            <button
                                                className="admin-btn admin-btn--secondary"
                                                disabled={actingOn === a.slug}
                                                onClick={() => transitionArticle(a.slug, "request_changes")}
                                            >
                                                Request Changes
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {data.media.length > 0 && (
                <section style={{ marginTop: "2rem" }}>
                    <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                        Media ({data.media.length})
                    </h2>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Media review actions coming soon — manage from Media admin for now.</p>
                </section>
            )}

            {data.events.length > 0 && (
                <section style={{ marginTop: "2rem" }}>
                    <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                        Events ({data.events.length})
                    </h2>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Event review actions coming soon — manage from Events admin for now.</p>
                </section>
            )}
        </div>
    );
}
