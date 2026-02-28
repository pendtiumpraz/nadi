"use client";

import { useState, useEffect } from "react";

interface ArticleSummary {
    slug: string;
    title: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
}

export default function ArticleList() {
    const [articles, setArticles] = useState<ArticleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    const fetchArticles = async () => {
        const res = await fetch("/api/articles");
        const data = await res.json();
        setArticles(data);
        setLoading(false);
    };

    useEffect(() => { fetchArticles(); }, []);

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

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading articles...</p>;

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}
            {articles.length === 0 ? (
                <div className="admin-empty">
                    <p>No articles yet.</p>
                    <a href="/admin/articles/new" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>Create Your First Article</a>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Author</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.map((a) => (
                            <tr key={a.slug}>
                                <td><strong>{a.title}</strong></td>
                                <td><span className="role-badge role-badge--user">{a.category}</span></td>
                                <td>{new Date(a.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                                <td>{a.author}</td>
                                <td>
                                    <div className="admin-actions">
                                        <a href={`/admin/articles/${a.slug}`} className="admin-btn admin-btn--secondary">Edit</a>
                                        <a href={`/publications/${a.slug}`} target="_blank" className="admin-btn">View</a>
                                        <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(a.slug, a.title)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
