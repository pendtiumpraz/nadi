"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
    const router = useRouter();
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorField, setErrorField] = useState<"none" | "credentials" | "account">("none");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorField("none");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            // next-auth wraps thrown errors with a generic "CredentialsSignin"; the inner code is in result.code (v5)
            const code = (result as unknown as { code?: string })?.code || result.error;
            if (code?.includes("PENDING_APPROVAL")) {
                setErrorField("account");
                toast.error("Account is pending admin approval. You'll receive an email once activated.");
            } else if (code?.includes("ACCOUNT_SUSPENDED")) {
                setErrorField("account");
                toast.error("Account is suspended. Contact an administrator.");
            } else if (code?.includes("THROTTLED")) {
                const seconds = Number(code.split(":")[1]) || 0;
                const mins = Math.ceil(seconds / 60);
                const wait = seconds < 60 ? `${seconds} seconds` : mins === 1 ? "about a minute" : `${mins} minutes`;
                setErrorField("credentials");
                toast.error(`Too many failed attempts. Please wait ${wait} before trying again.`);
            } else {
                setErrorField("credentials");
                toast.error("Invalid email or password.");
            }
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
                    <div className={`form-group${errorField !== "none" ? " field-error" : ""}`}>
                        <label htmlFor="login-email" className={errorField !== "none" ? "field-error-label" : ""}>Email Address</label>
                        <input
                            type="email"
                            id="login-email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); if (errorField !== "none") setErrorField("none"); }}
                            required
                            placeholder="you@email.com"
                            autoFocus
                        />
                    </div>
                    <div className={`form-group${errorField === "credentials" ? " field-error" : ""}`}>
                        <label htmlFor="login-password" className={errorField === "credentials" ? "field-error-label" : ""}>Password</label>
                        <input
                            type="password"
                            id="login-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (errorField !== "none") setErrorField("none"); }}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary login-submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Don&apos;t have an account? <a href="/register" style={{ color: "var(--crimson)", fontWeight: 600 }}>Register as a contributor</a>
                </div>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
