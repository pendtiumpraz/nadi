"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid email or password.");
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-logo">NADI</span>
                    <span className="login-logo-sub">Admin Portal</span>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            type="email"
                            id="login-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@nadi-health.id"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            type="password"
                            id="login-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <div className="form-error">{error}</div>}
                    <button type="submit" className="btn-primary login-submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
