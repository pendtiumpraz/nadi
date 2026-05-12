"use client";

import { useEffect, useState, useCallback } from "react";

interface ReviewItem {
    slug: string;
    title: string;
    category?: string;
    author?: string;
    date?: string;
    type?: string;
    status?: "in_review" | "approved" | "consent_received";
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

    const transitionArticle = async (slug: string, action: "approve" | "request_changes" | "publish") => {
        let notes = "";
        if (action === "request_changes") {
            notes = prompt("What changes are needed? (sent back to author)") || "";
            if (!notes.trim()) return;
        } else if (action === "publish") {
            if (!confirm("Publish this article? It will become visible on the public site.")) return;
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
            const successMsg = {
                approve: "✓ Approved. Consent email sent to the author.",
                request_changes: "✓ Sent back to author",
                publish: "✓ Published. Article is now live.",
            }[action];
            setMsg(successMsg);
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

            {data.articles.length > 0 && (() => {
                const inReview = data.articles.filter((a) => !a.status || a.status === "in_review");
                const awaitingConsent = data.articles.filter((a) => a.status === "approved");
                const readyToPublish = data.articles.filter((a) => a.status === "consent_received");
                const renderRow = (a: ReviewItem, kind: "review" | "approved" | "publish") => (
                    <tr key={a.slug}>
                        <td><a href={`/admin/articles/${a.slug}`} style={{ color: "var(--crimson)", textDecoration: "none", fontWeight: 600 }}>{a.title}</a></td>
                        <td>{a.category}</td>
                        <td>{a.author}</td>
                        <td>{a.date}</td>
                        <td>
                            <div className="admin-actions">
                                {kind === "review" && (
                                    <>
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
                                    </>
                                )}
                                {kind === "approved" && (
                                    <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontStyle: "italic" }}>
                                        Waiting for partner to submit consent form
                                    </span>
                                )}
                                {kind === "publish" && (
                                    <button
                                        className="admin-btn"
                                        style={{ background: "#8B1C1C", color: "#fff" }}
                                        disabled={actingOn === a.slug}
                                        onClick={() => transitionArticle(a.slug, "publish")}
                                    >
                                        {actingOn === a.slug ? "..." : "Publish"}
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                );

                return (
                    <>
                        {inReview.length > 0 && (
                            <section style={{ marginTop: "2rem" }}>
                                <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                                    Pending QC / Review ({inReview.length})
                                </h2>
                                <table className="admin-table">
                                    <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>
                                    <tbody>{inReview.map((a) => renderRow(a, "review"))}</tbody>
                                </table>
                            </section>
                        )}
                        {awaitingConsent.length > 0 && (
                            <section style={{ marginTop: "2rem" }}>
                                <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                                    Awaiting Consent Form ({awaitingConsent.length})
                                </h2>
                                <table className="admin-table">
                                    <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Date</th><th>Status</th></tr></thead>
                                    <tbody>{awaitingConsent.map((a) => renderRow(a, "approved"))}</tbody>
                                </table>
                            </section>
                        )}
                        {readyToPublish.length > 0 && (
                            <section style={{ marginTop: "2rem" }}>
                                <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                                    Ready to Publish ({readyToPublish.length})
                                </h2>
                                <table className="admin-table">
                                    <thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>
                                    <tbody>{readyToPublish.map((a) => renderRow(a, "publish"))}</tbody>
                                </table>
                            </section>
                        )}
                    </>
                );
            })()}

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
