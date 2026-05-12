"use client";

// ════════════════════════════════════════════════════════════════════
// Reusable pagination control.
// ────────────────────────────────────────────────────────────────────
// - Shows "Showing X–Y of Z" count (always visible when total > 0)
// - Prev / [1] [2] ... [n-1] [n] / Next number row (hidden when totalPages ≤ 1)
// - Numbered buttons compress with "…" for long sequences (matches the
//   public /publications pagination so the UX is consistent everywhere).
// - onPageChange callback fires with the new 1-based page number.
// ════════════════════════════════════════════════════════════════════

interface PaginationProps {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (next: number) => void;
    /** Word for the items being paginated, plural-form e.g. "articles". */
    itemLabel?: string;
    /** When true, scroll to top of viewport on page change. */
    scrollToTop?: boolean;
}

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

export default function Pagination({
    page,
    total,
    perPage,
    onPageChange,
    itemLabel = "rows",
    scrollToTop = false,
}: PaginationProps): React.JSX.Element | null {
    if (total === 0) return null;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    const go = (next: number) => {
        const clamped = Math.max(1, Math.min(totalPages, next));
        onPageChange(clamped);
        if (scrollToTop && typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div style={{
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            margin: "1.5rem 0",
        }}>
            {totalPages > 1 && (
                <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: "0.78rem", padding: "5px 12px" }}
                    disabled={page <= 1}
                    onClick={() => go(page - 1)}
                >
                    ← Prev
                </button>
            )}
            {totalPages > 1 && pageNumbers(page, totalPages).map((p, i) =>
                p === "…"
                    ? <span key={`gap-${i}`} style={{ color: "var(--muted)", fontSize: "0.78rem", padding: "0 4px" }}>…</span>
                    : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => go(p as number)}
                            style={{
                                fontSize: "0.78rem",
                                padding: "5px 11px",
                                border: `1px solid ${p === page ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                                background: p === page ? "var(--crimson, #8B1C1C)" : "#fff",
                                color: p === page ? "#fff" : "var(--ink, #2C2C2C)",
                                cursor: "pointer",
                                borderRadius: 3,
                                fontWeight: p === page ? 600 : 400,
                            }}
                        >
                            {p}
                        </button>
                    )
            )}
            <span style={{ color: "var(--muted)", fontSize: "0.78rem", margin: "0 0.5rem" }}>
                Showing {start}–{end} of {total} {itemLabel}
            </span>
            {totalPages > 1 && (
                <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: "0.78rem", padding: "5px 12px" }}
                    disabled={page >= totalPages}
                    onClick={() => go(page + 1)}
                >
                    Next →
                </button>
            )}
        </div>
    );
}
