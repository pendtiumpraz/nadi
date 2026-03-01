"use client";

import { useState, useEffect } from "react";
import ArticleCard from "@/components/ArticleCard";

interface ArticleItem {
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    date: string;
    readTime: string;
    author: string;
    coverColor: "crimson" | "charcoal" | "dark";
    coverImage?: string;
    seo: { description: string; keywords: string[] };
    blocks: never[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const PER_PAGE = 9;
const CATEGORIES = [
    "ALL",
    "POLICY BRIEF",
    "RESEARCH PAPER",
    "STRATEGIC ANALYSIS",
    "WORKING PAPER",
    "RESEARCH NOTE",
];

export default function PublicationsList() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
        if (category !== "ALL") params.set("category", category);
        fetch(`/api/public/articles?${params}`)
            .then((r) => r.json())
            .then((data) => {
                setArticles(data.articles || []);
                setPagination(data.pagination || null);
            })
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, [page, category]);

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        setPage(1);
    };

    return (
        <>
            {/* Category Filter */}
            <div className="pub-filters">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`pub-filter-btn${category === cat ? " active" : ""}`}
                        onClick={() => handleCategoryChange(cat)}
                    >
                        {cat === "ALL" ? "All" : cat.split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ")}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
                    Loading publications...
                </div>
            ) : articles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
                    No publications found{category !== "ALL" ? ` in "${category}"` : ""}.
                </div>
            ) : (
                <>
                    <div className="publications-grid">
                        {articles.map((article, i) => (
                            <ArticleCard
                                key={article.slug}
                                article={article as ArticleItem & { blocks: [] }}
                                featured={page === 1 && i === 0}
                            />
                        ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                ← Previous
                            </button>
                            <div className="pagination-pages">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                    <button key={p} className={`pagination-num${p === page ? " active" : ""}`} onClick={() => setPage(p)}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <span className="pagination-info">
                                Page {page} of {pagination.totalPages} · {pagination.total} articles
                            </span>
                            <button className="pagination-btn" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
