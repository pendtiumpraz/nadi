"use client";

import * as React from "react";

interface Props {
    consentId: number;
    articleSlug: string;
}

const SIZES: { key: string; label: string }[] = [
    { key: "A4", label: "A4 (210 × 297 mm)" },
    { key: "LETTER", label: "Letter (8.5 × 11 in)" },
    { key: "F4", label: "F4 / Folio (8.5 × 13 in)" },
    { key: "LEGAL", label: "Legal (8.5 × 14 in)" },
];

/**
 * Toolbar buttons for the consent document page. Clicking "Download PDF" hits
 * the server-side /api/admin/consents/[id]/pdf endpoint with the chosen paper
 * size and downloads a real PDF — no print dialog involved.
 */
export default function ConsentDocumentActions({ consentId, articleSlug }: Props): React.JSX.Element {
    const [size, setSize] = React.useState("A4");

    const downloadHref = `/api/admin/consents/${consentId}/pdf?size=${encodeURIComponent(size)}`;

    return (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <a
                href="/admin/consents"
                className="admin-btn admin-btn--secondary"
                style={{ textDecoration: "none" }}
            >
                ← Back to list
            </a>
            <a
                href={`/admin/articles/${articleSlug}`}
                className="admin-btn"
                style={{ background: "var(--crimson)", color: "#fff", textDecoration: "none" }}
            >
                Open article →
            </a>
            <div style={{ display: "inline-flex", alignItems: "stretch", border: "1px solid #1a1a1a", borderRadius: 4, overflow: "hidden" }}>
                <label
                    htmlFor="consent-pdf-size"
                    style={{
                        background: "#2C2C2C",
                        color: "#aaa",
                        padding: "0 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        borderRight: "1px solid #444",
                    }}
                >
                    Size
                </label>
                <select
                    id="consent-pdf-size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    style={{
                        background: "#fff",
                        color: "#1a1a1a",
                        border: "none",
                        padding: "0 28px 0 10px",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    {SIZES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                </select>
                <a
                    href={downloadHref}
                    style={{
                        background: "#1a7a3e",
                        color: "#fff",
                        padding: "0 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        borderLeft: "1px solid #444",
                    }}
                >
                    ⤓ Download PDF
                </a>
            </div>
        </div>
    );
}
