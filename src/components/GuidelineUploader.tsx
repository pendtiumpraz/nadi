"use client";

import { useRef, useState } from "react";

interface Props {
    currentUrl: string;
}

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT =
    ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function GuidelineUploader({ currentUrl }: Props) {
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [message, setMessage] = useState<string>("");
    const [newUrl, setNewUrl] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_BYTES) {
            setStatus("error");
            setMessage("File too large (max 25 MB).");
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        setStatus("uploading");
        setMessage("Uploading…");
        setNewUrl("");

        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/guidelines/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) {
                setStatus("error");
                setMessage(data?.error || "Upload failed.");
                return;
            }
            setStatus("success");
            setMessage("✓ Uploaded! The new guideline is live.");
            setNewUrl(data.url as string);
        } catch (err) {
            setStatus("error");
            setMessage((err as Error).message || "Upload failed.");
        } finally {
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const effectiveUrl = newUrl || currentUrl;

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleChange}
                disabled={status === "uploading"}
                style={{
                    display: "block",
                    padding: "8px 10px",
                    border: "1px solid var(--line, #ddd)",
                    borderRadius: 4,
                    fontSize: "0.85rem",
                    background: "#fff",
                }}
            />

            {status === "uploading" && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>Uploading…</p>
            )}

            {status === "success" && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                    <div style={{ color: "#1a7f37", fontWeight: 600 }}>{message}</div>
                    {effectiveUrl && (
                        <div style={{ marginTop: "0.3rem" }}>
                            <a
                                href={effectiveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--crimson, #8B1C1C)", textDecoration: "underline" }}
                            >
                                {effectiveUrl}
                            </a>
                        </div>
                    )}
                </div>
            )}

            {status === "error" && (
                <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#c44", fontWeight: 600 }}>
                    {message}
                </p>
            )}
        </div>
    );
}
