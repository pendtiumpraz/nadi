"use client";

import { useState } from "react";

interface ApproveButtonProps {
    slug: string;
    /** Article's current status — button is only ENABLED when status === 'in_review'. */
    currentStatus: string;
    /** Callback after successful approve so parent can refresh. */
    onApproved?: () => void;
}

export default function ApproveButton({ slug, currentStatus, onApproved }: ApproveButtonProps): React.JSX.Element {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const enabled = currentStatus === "in_review";
    const disabled = !enabled || busy;

    const handleClick = async () => {
        if (!enabled) return;
        if (!confirm("Approve this article? The author will receive an email with the consent-form link.")) return;

        setBusy(true);
        try {
            const res = await fetch(`/api/articles/${slug}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Request failed");
            setMsg("✓ Approved. Consent email sent to the author.");
            window.setTimeout(() => setMsg(""), 4000);
            onApproved?.();
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
                title={enabled ? undefined : "Approve is only available when the article is in review."}
                style={{
                    background: "#1a7a3e",
                    color: "white",
                    padding: "8px 18px",
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                }}
            >
                {busy ? "Approving..." : "Approve"}
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
                </div>
            )}
        </div>
    );
}
