"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComposeNewsletter() {
    const router = useRouter();
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [stats, setStats] = useState<{ sent: number; errors: number } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setStats(null);

        if (!subject.trim() || !content.trim()) {
            setMessage("Subject and content are required.");
            return;
        }

        if (!confirm("Are you sure you want to send this newsletter to ALL active subscribers?")) {
            return;
        }

        setLoading(true);
        setMessage("Sending emails... Please do not close this window.");

        try {
            const res = await fetch("/api/newsletter/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, content }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Broadcast completed successfully!");
                setStats({ sent: data.sent, errors: data.errors });
                setSubject("");
                setContent("");
            } else {
                setMessage(`Error: ${data.error || "Failed to send emails"}`);
            }
        } catch (error) {
            setMessage(`System error: ${(error as Error).message}`);
        }
        setLoading(false);
    };

    return (
        <div className="admin-content">
            <div className="admin-content-header" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1 className="admin-page-title">Broadcast Newsletter</h1>
                    <p className="admin-page-desc">Send email directly to all your active subscribers via Gmail.</p>
                </div>
                <div className="admin-actions">
                    <button className="btn-outline" onClick={() => router.push("/admin/newsletter")}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSend} disabled={loading}>
                        {loading ? "Sending..." : "Send Broadcast"}
                    </button>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    borderRadius: "6px",
                    background: message.includes("Error") ? "var(--crimson-pale)" : "rgba(44, 122, 75, 0.1)",
                    color: message.includes("Error") ? "var(--crimson)" : "#2C7A4B",
                    border: `1px solid ${message.includes("Error") ? "rgba(139,28,28,0.2)" : "rgba(44, 122, 75, 0.2)"}`
                }}>
                    <strong>{message}</strong>
                    {stats && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                            Success: {stats.sent} emails delivered. <br />
                            Failed: {stats.errors} emails failed.
                        </div>
                    )}
                </div>
            )}

            <div className="editor-container" style={{ background: "var(--cream)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Email Subject</div>
                    <input
                        type="text"
                        className="adm-input"
                        placeholder="e.g. NADI Monthly Recap: New Health Policy Insights"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="editor-section">
                    <div className="editor-section-title">Email Body <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— You can use HTML tags (e.g., &lt;b&gt;, &lt;br&gt;, &lt;a href="..."&gt;)</span></div>
                    <textarea
                        className="adm-textarea"
                        placeholder="Write your newsletter content here..."
                        rows={16}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={loading}
                        style={{ fontFamily: "monospace", fontSize: "0.9rem", lineHeight: "1.6" }}
                    />
                </div>

                <div style={{ padding: "1.5rem", borderTop: "1px solid var(--line)", background: "rgba(0,0,0,0.02)", fontSize: "0.85rem", color: "var(--muted)" }}>
                    <strong>Note:</strong> Since we are using Gmail SMTP, please be careful not to send too many emails per day to avoid being rate-limited by Google (limit is usually ~500/day for standard Gmail).
                    This will send individual emails to each active subscriber using BCC.
                </div>
            </div>
        </div>
    );
}
