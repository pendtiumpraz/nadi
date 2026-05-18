"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/Toast";

export default function ForgotPasswordPage() {
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setSent(true);
                toast.success("If that email is registered, a reset link is on its way.");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        } catch {
            toast.error("Network error. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-logo">NADI</span>
                    <span className="login-logo-sub">Forgot Password</span>
                </div>
                {sent ? (
                    <div style={{ padding: "1rem", background: "rgba(40,140,80,0.1)", border: "1px solid rgba(40,140,80,0.25)", borderRadius: 4, color: "#1a7a3e", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        ✓ If <strong>{email}</strong> is a registered NADI account, a password reset link has been emailed. The link is valid for 1 hour.
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 1rem", lineHeight: 1.55 }}>
                            Enter the email address linked to your NADI account. If we find it, we&apos;ll send a password reset link.
                        </p>
                        <div className="form-group">
                            <label htmlFor="fp-email">Email Address</label>
                            <input
                                type="email"
                                id="fp-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@email.com"
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn-primary login-submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}
                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Remembered it? <a href="/login" style={{ color: "var(--crimson)", fontWeight: 600 }}>Back to sign in</a>
                </div>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
