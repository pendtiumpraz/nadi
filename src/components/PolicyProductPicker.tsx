"use client";

import * as React from "react";
import {
    POLICY_PRODUCT_LIST,
    type PolicyProductType,
    type PolicyProductDef,
} from "@/data/policy-products";

export interface PolicyProductPickerProps {
    value: PolicyProductType | "";
    onChange: (next: PolicyProductType) => void;
    /**
     * Optional list of types to render. When omitted the picker self-fetches
     * from /api/public/policy-products. Most callers (e.g. ArticleEditor) pass
     * this in once at the top so the dynamic list is shared with scaffold +
     * word-count guidance without firing duplicate requests.
     */
    items?: PolicyProductDef[];
    /**
     * Optional: URL to download the guideline PDF. Kept for backwards compatibility,
     * but the picker now always links to the public `/policy-guideline` explainer
     * page (which itself handles the empty / not-uploaded state gracefully).
     */
    guidelineUrl?: string;
    /** If true, picker becomes read-only (e.g. when editing an article whose type is fixed). */
    disabled?: boolean;
}

function formatWordRange(wc: PolicyProductDef["wordCount"]): string {
    const min = wc.min.toLocaleString();
    if (wc.max === null) return `${min}+ words`;
    return `${min}–${wc.max.toLocaleString()} words`;
}

export default function PolicyProductPicker(
    props: PolicyProductPickerProps
): React.JSX.Element {
    // `guidelineUrl` is intentionally ignored — we always route to the public
    // /policy-guideline page so users see the explainer (and the empty-state
    // message) before downloading. The prop is preserved for API compatibility.
    const { value, onChange, disabled = false, items } = props;
    const [fetched, setFetched] = React.useState<PolicyProductDef[] | null>(items ?? null);

    React.useEffect(() => {
        if (items) { setFetched(items); return; }
        let cancelled = false;
        fetch("/api/public/policy-products")
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data.items)) setFetched(data.items);
                else setFetched(POLICY_PRODUCT_LIST);
            })
            .catch(() => { if (!cancelled) setFetched(POLICY_PRODUCT_LIST); });
        return () => { cancelled = true; };
    }, [items]);

    const list = fetched ?? POLICY_PRODUCT_LIST;

    const selected: PolicyProductDef | null = React.useMemo(() => {
        if (!value) return null;
        return list.find((p) => p.key === value) ?? null;
    }, [value, list]);

    return (
        <div style={{ marginBottom: "1.25rem" }}>
            {/* Header row: label + optional download link */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    marginBottom: "0.6rem",
                }}
            >
                <div
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        fontWeight: 600,
                    }}
                >
                    Policy Product Type *
                </div>
                <a
                    href="/policy-guideline"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: "0.78rem",
                        color: "var(--crimson, #8B1C1C)",
                        textDecoration: "none",
                        padding: "4px 10px",
                        border: "1px solid var(--line, #ddd)",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                    }}
                >
                    📥 Download guideline
                </a>
            </div>

            {/* Cards grid */}
            <div
                role="radiogroup"
                aria-label="Policy product type"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "0.75rem",
                }}
            >
                {list.map((p) => {
                    const isSelected = value === p.key;
                    return (
                        <label
                            key={p.key}
                            role="radio"
                            aria-checked={isSelected}
                            aria-disabled={disabled || undefined}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                                padding: "0.9rem 1rem",
                                border: `1px solid ${
                                    isSelected
                                        ? "var(--crimson, #8B1C1C)"
                                        : "var(--line, #ddd)"
                                }`,
                                borderRadius: 4,
                                background: isSelected
                                    ? "rgba(139,28,28,0.06)"
                                    : "#fff",
                                cursor: disabled ? "not-allowed" : "pointer",
                                opacity: disabled ? 0.55 : 1,
                                transition: "all 0.15s",
                            }}
                        >
                            <input
                                type="radio"
                                name="policy_product_type"
                                value={p.key}
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => {
                                    if (disabled) return;
                                    onChange(p.key);
                                }}
                                style={{
                                    position: "absolute",
                                    opacity: 0,
                                    pointerEvents: "none",
                                    width: 0,
                                    height: 0,
                                }}
                            />
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    lineHeight: 1.25,
                                    color: isSelected
                                        ? "var(--crimson, #8B1C1C)"
                                        : "inherit",
                                }}
                            >
                                {p.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "0.78rem",
                                    color: "var(--muted)",
                                    lineHeight: 1.4,
                                }}
                            >
                                {p.shortDescription}
                            </div>
                            <div
                                style={{
                                    marginTop: "0.25rem",
                                    fontSize: "0.72rem",
                                    color: "var(--muted)",
                                    fontFamily: "var(--font-mono)",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {formatWordRange(p.wordCount)}
                                {" · "}
                                {p.pageLength}
                            </div>
                        </label>
                    );
                })}
            </div>

            {/* Info strip for the selected product */}
            {selected && (
                <div
                    style={{
                        marginTop: "0.6rem",
                        fontSize: "0.78rem",
                        color: "var(--muted)",
                        lineHeight: 1.5,
                    }}
                >
                    <span style={{ fontWeight: 600 }}>Tone:</span> {selected.tone}
                    {" · "}
                    <span style={{ fontWeight: 600 }}>Primary research:</span>{" "}
                    {selected.primaryResearchNote}
                </div>
            )}
        </div>
    );
}
