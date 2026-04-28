"use client";

import { useState, FormEvent } from "react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed.");
            setSuccess(data.message || "Registration received. Wait for admin activation.");
            setName("");
            setEmail("");
            setPassword("");
        } catch (err) {
            setError((err as Error).message);
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-logo">NADI</span>
                    <span className="login-logo-sub">Contributor Registration</span>
                </div>
                {success ? (
                    <div style={{ padding: "1rem", background: "rgba(40,140,80,0.1)", border: "1px solid rgba(40,140,80,0.25)", borderRadius: 4, color: "#1a7a3e", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        ✓ {success}
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 1rem", lineHeight: 1.55 }}>
                            Apply for a contributor account. After registering, an admin will review and activate your access — you&apos;ll get an email once approved.
                        </p>
                        <div className="form-group">
                            <label htmlFor="reg-name">Full Name</label>
                            <input
                                type="text"
                                id="reg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-email">Email Address</label>
                            <input
                                type="email"
                                id="reg-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <input
                                type="password"
                                id="reg-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                            />
                        </div>
                        {error && <div className="form-error">{error}</div>}
                        <button type="submit" className="btn-primary login-submit" disabled={loading}>
                            {loading ? "Sending..." : "Request Account"}
                        </button>
                    </form>
                )}
                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Already have an account? <a href="/login" style={{ color: "var(--crimson)", fontWeight: 600 }}>Sign in</a>
                </div>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
