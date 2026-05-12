"use client";

import { useState } from "react";

interface PublishButtonProps {
    slug: string;
    currentStatus: string;
    /** Callback after successful publish. */
    onPublished?: () => void;
}

export default function PublishButton({ slug, currentStatus, onPublished }: PublishButtonProps): React.JSX.Element {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const enabled = currentStatus === "consent_received";
    const disabled = !enabled || busy;

    const handleClick = async () => {
        if (!enabled) return;
        if (!confirm("Publish this article? It will become visible on the public site.")) return;

        setBusy(true);
        try {
            const res = await fetch(`/api/articles/${slug}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "publish" }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Request failed");
            setMsg("✓ Published! The article is now live.");
            window.setTimeout(() => setMsg(""), 4000);
            onPublished?.();
        } catch (err) {
            setMsg(`Error: ${(err as Error).message}`);
            window.setTimeout(() => setMsg(""), 6000);
        }
        setBusy(false);
    };

    return (
        <div>
            <button
                type="button"
                className="admin-btn"
                disabled={disabled}
                onClick={handleClick}
                title={enabled ? undefined : "Publish is only available after the consent-to-publish form has been submitted."}
                style={{
                    background: "#8B1C1C",
                    color: "white",
                    padding: "8px 18px",
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                }}
            >
                {busy ? "Publishing..." : "Publish"}
            </button>
            {msg && (
                <div
                    style={{
                        marginTop: "0.5rem",
                        fontSize: "0.9rem",
                        color: msg.startsWith("Error") ? "var(--crimson)" : "#1a7a3e",
                    }}
                >
                    {msg}
                    {!msg.startsWith("Error") && (
                        <>
                            {" "}
                            <a href={`/publications/${slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1a7a3e", textDecoration: "underline", fontWeight: 600 }}>
                                View →
                            </a>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
