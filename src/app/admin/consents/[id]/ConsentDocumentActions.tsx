"use client";

import * as React from "react";

interface Props {
    articleSlug: string;
    signatoryName: string;
}

/**
 * Toolbar buttons for the consent document page. Lives in its own client
 * component so the rest of the page can stay server-rendered.
 *
 * "Save as PDF" simply triggers the browser's print dialog with the consent
 * document styled for print — the user picks "Save as PDF" in the dialog.
 * Avoids shipping a heavyweight PDF generator and keeps the rendering
 * identical to what they see on screen.
 */
export default function ConsentDocumentActions({ articleSlug, signatoryName }: Props): React.JSX.Element {
    const handlePrint = () => {
        const original = document.title;
        document.title = `Consent — ${signatoryName} — ${articleSlug}`;
        window.print();
        // Restore the tab title after the dialog closes. Safari fires the
        // afterprint event reliably; for browsers that don't, a setTimeout
        // gives the dialog enough time to capture the title.
        const restore = () => { document.title = original; };
        window.addEventListener("afterprint", restore, { once: true });
        window.setTimeout(restore, 4000);
    };

    return (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
            <button
                type="button"
                onClick={handlePrint}
                className="admin-btn"
                style={{ background: "#2C2C2C", color: "#fff" }}
            >
                ⤓ Save as PDF
            </button>
        </div>
    );
}
