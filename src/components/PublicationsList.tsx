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

export default function PublicationsList() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/public/articles?page=${page}&limit=${PER_PAGE}`)
            .then((r) => r.json())
            .then((data) => {
                setArticles(data.articles || []);
                setPagination(data.pagination || null);
            })
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, [page]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
                Loading publications...
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>
                No publications yet.
            </div>
        );
    }

    return (
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                    >
                        ← Previous
                    </button>
                    <div className="pagination-pages">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                className={`pagination-num${p === page ? " active" : ""}`}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <span className="pagination-info">
                        Page {page} of {pagination.totalPages} · {pagination.total} articles
                    </span>
                    <button
                        className="pagination-btn"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </>
    );
}
