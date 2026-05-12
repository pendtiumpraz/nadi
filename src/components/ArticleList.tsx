"use client";

import { useState, useMemo, useEffect } from "react";
import Pagination from "@/components/Pagination";

const PER_PAGE = 15;

type Status = "draft" | "in_review" | "approved" | "consent_received" | "published";

interface ArticleSummary {
    slug: string;
    title: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
    status?: Status;
    feedbackPending?: boolean;
}

interface ArticleListProps {
    initialArticles?: ArticleSummary[];
    partnerView?: boolean;
}

const STATUS_LABEL: Record<Status, string> = {
    draft: "Draft",
    in_review: "In Review",
    approved: "Approved",
    consent_received: "Consent Received",
    published: "Published",
};

const STATUS_COLOUR: Record<Status, { bg: string; fg: string }> = {
    draft: { bg: "rgba(150,150,150,0.15)", fg: "#666" },
    in_review: { bg: "rgba(220,150,40,0.15)", fg: "#9a6a10" },
    approved: { bg: "rgba(140,90,200,0.15)", fg: "#6a3a9a" },
    consent_received: { bg: "rgba(30,90,170,0.12)", fg: "#1d4a8a" },
    published: { bg: "rgba(40,140,80,0.12)", fg: "#1a7a3e" },
};

const FILTERS: { key: "all" | Status; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Drafts" },
    { key: "in_review", label: "In Review" },
    { key: "approved", label: "Approved" },
    { key: "consent_received", label: "Consent Received" },
    { key: "published", label: "Published" },
];

export default function ArticleList({ initialArticles = [], partnerView = false }: ArticleListProps) {
    const [articles, setArticles] = useState<ArticleSummary[]>(initialArticles);
    const [filter, setFilter] = useState<"all" | Status>("all");
    const [page, setPage] = useState(1);
    const [msg, setMsg] = useState("");

    // Reset to page 1 whenever the filter changes
    useEffect(() => { setPage(1); }, [filter]);

    const fetchArticles = async () => {
        const res = await fetch("/api/articles");
        const data = await res.json();
        setArticles(data);
    };

    const handleDelete = async (slug: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        const res = await fetch(`/api/articles?slug=${slug}`, { method: "DELETE" });
        if (res.ok) {
            setMsg("Article deleted.");
            fetchArticles();
        } else {
            const data = await res.json();
            setMsg(data.error || "Failed to delete.");
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: articles.length };
        for (const a of articles) {
            const s = a.status || "published";
            c[s] = (c[s] || 0) + 1;
        }
        return c;
    }, [articles]);

    const filtered = filter === "all" ? articles : articles.filter((a) => (a.status || "published") === filter);
    const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            {articles.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {FILTERS.map((f) => {
                        const count = counts[f.key] || 0;
                        if (f.key !== "all" && count === 0) return null;
                        const active = filter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={active ? "btn-primary" : "btn-outline"}
                                style={{ fontSize: "0.78rem", padding: "5px 12px" }}
                            >
                                {f.label} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {articles.length === 0 ? (
                <div className="admin-empty">
                    {partnerView ? (
                        <>
                            <p>You haven&apos;t submitted any policy products yet.</p>
                            <a href="/admin/articles/new" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>Submit your first policy product</a>
                        </>
                    ) : (
                        <>
                            <p>No articles yet.</p>
                            <a href="/admin/articles/new" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>Create Your First Article</a>
                        </>
                    )}
                </div>
            ) : visible.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
                    No articles match this filter.
                </p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Author</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((a) => {
                            const status: Status = a.status || "published";
                            const c = STATUS_COLOUR[status];
                            return (
                                <tr key={a.slug}>
                                    <td>
                                        <strong>{a.title}</strong>
                                        {a.feedbackPending && (
                                            <span title="Reviewer comments awaiting your reply" style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "#9a6a10" }}>
                                                💬 feedback
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: "inline-block",
                                            padding: "3px 10px",
                                            borderRadius: 12,
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                            background: c.bg,
                                            color: c.fg,
                                            whiteSpace: "nowrap",
                                        }}>
                                            {STATUS_LABEL[status]}
                                        </span>
                                    </td>
                                    <td><span className="role-badge role-badge--user">{a.category}</span></td>
                                    <td>{new Date(a.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                                    <td>{a.author}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <a href={`/admin/articles/${a.slug}`} className="admin-btn admin-btn--secondary">Edit</a>
                                            {status === "published" && (
                                                <a href={`/publications/${a.slug}`} target="_blank" className="admin-btn">View</a>
                                            )}
                                            <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(a.slug, a.title)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {filtered.length > 0 && (
                <Pagination
                    page={page}
                    total={filtered.length}
                    perPage={PER_PAGE}
                    onPageChange={setPage}
                    itemLabel={partnerView ? "submissions" : "articles"}
                />
            )}
        </div>
    );
}
