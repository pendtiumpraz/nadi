"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import V2PageLayout from "@/components/V2PageLayout";
import { POLICY_PRODUCT_LIST, getProduct, type PolicyProductType } from "@/data/policy-products";
import "@/app/landing-v2.css";

const SUBMIT_TARGET = "/admin/articles/new";

interface ArticleItem {
    slug: string; title: string; subtitle: string; category: string;
    date: string; readTime: string; author: string; coverImage?: string;
    pdfUrl?: string;
    policyProductType?: PolicyProductType | null;
}

interface Pagination { page: number; totalPages: number; total: number; }

// Filter chips: "All" + the 3 canonical policy product types from the guideline.
// Legacy `category` strings remain in the data for backwards compat but the
// filter UX surfaces only product types per the NADI guideline doc.
const FILTERS: { key: "ALL" | PolicyProductType; label: string }[] = [
    { key: "ALL", label: "All" },
    ...POLICY_PRODUCT_LIST.map((p) => ({ key: p.key, label: p.label })),
];

/** Returns the visible page-number sequence with "…" gaps for large totals.
 *  Layout: [1] … [c-1] [c] [c+1] … [last] — always shows first/last, current ±1. */
function pageNumbers(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    if (current > 3) out.push("…");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) out.push(i);
    if (current < total - 2) out.push("…");
    out.push(total);
    return out;
}

export default function PublicationsPage() {
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<"ALL" | PolicyProductType>("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const PER_PAGE = 9;
    const { data: session, status } = useSession();
    const isAuthed = status === "authenticated" && !!session?.user;
    // Logged-in users go straight to the editor; visitors are bounced through
    // /login (which honours callbackUrl) and land in the editor after auth.
    const submitHref = isAuthed
        ? SUBMIT_TARGET
        : `/login?callbackUrl=${encodeURIComponent(SUBMIT_TARGET)}`;

    // Reset to page 1 whenever the filter changes — handled in the filter onClick already.

    useEffect(() => {
        setLoading(true);
        setError(false);
        const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
        // Filter by policy_product_type via the API. Falls back to legacy
        // `category` query if the type isn't matched (back-compat for old rows).
        if (filter !== "ALL") {
            params.set("policy_product_type", filter);
            // Also set legacy category so older articles still appear in the bucket
            const product = POLICY_PRODUCT_LIST.find((p) => p.key === filter);
            if (product) params.set("category", product.legacyCategory);
        }
        fetch(`/api/public/articles?${params}`)
            .then((r) => {
                if (!r.ok) throw new Error("fetch failed");
                return r.json();
            })
            .then((data) => { setArticles(data.articles || []); setPagination(data.pagination || null); })
            .catch(() => { setArticles([]); setError(true); })
            .finally(() => setLoading(false));
    }, [page, filter]);

    return (
        <V2PageLayout title="Publications & <em>Insights</em>" eyebrow="Research & Analysis">
            {/* Submit-a-publication CTA */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1.1rem 1.4rem",
                    background: "#fafafa",
                    border: "1px solid #E8E5E1",
                    borderLeft: "3px solid #8B1C1C",
                    borderRadius: 4,
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                        Have a policy product to share?
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.5 }}>
                        Submit your Policy Brief, Policy Paper, or Opinion Piece for review and publication on NADI.
                    </div>
                </div>
                <a
                    href={submitHref}
                    style={{
                        display: "inline-block",
                        padding: "10px 22px",
                        background: "#8B1C1C",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderRadius: 2,
                        whiteSpace: "nowrap",
                    }}
                >
                    Submit a Publication →
                </a>
            </div>

            {/* Policy Product Type Filter */}
            <div className="v2-filters">
                {FILTERS.map((f) => (
                    <button key={f.key} className={`v2-filter-btn${filter === f.key ? " active" : ""}`}
                        onClick={() => { setFilter(f.key); setPage(1); }}>
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading publications...</p>
            ) : error ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#c44" }}>Couldn&apos;t load publications. Please refresh or try again later.</p>
            ) : articles.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>No publications found{filter !== "ALL" ? ` in this category` : ""}.</p>
            ) : (
                <>
                    <div className="v2-pub-list">
                        {articles.map((a) => (
                            <a href={`/publications/${a.slug}`} className="v2-pub-item" key={a.slug}>
                                <div className="v2-pub-meta">
                                    {a.coverImage && (
                                        <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: 3, background: "#f3f3f3", marginBottom: "0.5rem" }}>
                                            <img src={a.coverImage} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        </div>
                                    )}
                                    <span className="v2-pub-type">{getProduct(a.policyProductType)?.label || a.category}</span>
                                    {a.pdfUrl && (
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                            padding: "0.15rem 0.5rem",
                                            background: "rgba(139,28,28,0.08)",
                                            color: "#8B1C1C",
                                            borderRadius: "3px",
                                            fontSize: "0.65rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.04em",
                                        }}>
                                            📄 PDF
                                        </span>
                                    )}
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

                    {pagination && (
                        <div className="v2-pagination">
                            {pagination.totalPages > 1 && (
                                <button disabled={page <= 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>← Prev</button>
                            )}
                            {pagination.totalPages > 1 && pageNumbers(page, pagination.totalPages).map((p, i) => (
                                p === "…"
                                    ? <span key={`gap-${i}`} className="v2-pagination-info" style={{ padding: "0 4px" }}>…</span>
                                    : <button key={p} className={p === page ? "active" : ""} onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{p}</button>
                            ))}
                            <span className="v2-pagination-info">
                                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, pagination.total)} of {pagination.total} publication{pagination.total === 1 ? "" : "s"}
                            </span>
                            {pagination.totalPages > 1 && (
                                <button disabled={page >= pagination.totalPages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Next →</button>
                            )}
                        </div>
                    )}
                </>
            )}
        </V2PageLayout>
    );
}
