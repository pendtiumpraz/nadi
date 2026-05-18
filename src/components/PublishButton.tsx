"use client";

import { useState } from "react";
import { confirmDialog, useToast } from "@/components/Toast";

interface PublishButtonProps {
    slug: string;
    currentStatus: string;
    /** Callback after successful publish. */
    onPublished?: () => void;
}

export default function PublishButton({ slug, currentStatus, onPublished }: PublishButtonProps): React.JSX.Element {
    const [busy, setBusy] = useState(false);
    const toast = useToast();

    const enabled = currentStatus === "consent_received";
    const disabled = !enabled || busy;

    const handleClick = async () => {
        if (!enabled) return;
        const ok = await confirmDialog({
            title: "Publish article?",
            message: "It will become visible on the public site.",
            confirmText: "Publish",
        });
        if (!ok) return;

        setBusy(true);
        try {
            const res = await fetch(`/api/articles/${slug}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "publish" }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Request failed");
            toast.success(`Published! View at /publications/${slug}`);
            onPublished?.();
        } catch (err) {
            toast.error((err as Error).message);
        }
        setBusy(false);
    };

    return (
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
    );
}
