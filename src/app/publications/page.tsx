"use client";

import { useState, useEffect } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface ArticleItem {
    slug: string; title: string; subtitle: string; category: string;
    date: string; readTime: string; author: string; coverImage?: string;
}

interface Pagination { page: number; totalPages: number; total: number; }

const CATEGORIES = ["ALL", "POLICY BRIEF", "RESEARCH PAPER", "STRATEGIC ANALYSIS", "WORKING PAPER", "RESEARCH NOTE"];

export default function PublicationsPage() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "9" });
        if (category !== "ALL") params.set("category", category);
        fetch(`/api/public/articles?${params}`)
            .then((r) => r.json())
            .then((data) => { setArticles(data.articles || []); setPagination(data.pagination || null); })
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, [page, category]);

    return (
        <V2PageLayout title="Publications & <em>Insights</em>" eyebrow="Research & Analysis">
            {/* Category Filter */}
            <div className="v2-filters">
                {CATEGORIES.map((cat) => (
                    <button key={cat} className={`v2-filter-btn${category === cat ? " active" : ""}`}
                        onClick={() => { setCategory(cat); setPage(1); }}>
                        {cat === "ALL" ? "All" : cat.split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading publications...</p>
            ) : articles.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>No publications found{category !== "ALL" ? ` in this category` : ""}.</p>
            ) : (
                <>
                    <div className="v2-pub-list">
                        {articles.map((a) => (
                            <a href={`/publications/${a.slug}`} className="v2-pub-item" key={a.slug}>
                                <div className="v2-pub-meta">
                                    <span className="v2-pub-type">{a.category}</span>
                                    <span className="v2-pub-date">{a.date}</span>
                                </div>
                                <div className="v2-pub-body">
                                    <h3>{a.title}</h3>
                                    <p>{a.subtitle}</p>
                                </div>
                                <span className="v2-pub-arrow">→</span>
                            </a>
                        ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="v2-pagination">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <span className="v2-pagination-info">{pagination.total} articles</span>
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </V2PageLayout>
    );
}
