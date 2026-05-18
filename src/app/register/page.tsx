"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";

// Same rules as login — only accept relative paths so we can't be used as
// an open redirect to an attacker-controlled URL.
function safeRedirect(value: string | null): string {
    if (!value) return "";
    if (!value.startsWith("/") || value.startsWith("//")) return "";
    return value;
}

// Wrap the search-params reader in Suspense so Next 15+ can stream the
// shell while query params hydrate.
export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterPageInner />
        </Suspense>
    );
}

type Role = "contributor" | "partner";

const ROLE_OPTIONS: { key: Role; label: string; tagline: string }[] = [
    {
        key: "contributor",
        label: "Contributor",
        tagline: "NADI-affiliated writer / researcher drafting policy products inside the CMS.",
    },
    {
        key: "partner",
        label: "Partner",
        tagline: "External organization submitting policy products for NADI review and publication.",
    },
];

function RegisterPageInner() {
    const searchParams = useSearchParams();
    const callbackUrl = safeRedirect(searchParams?.get("callbackUrl") ?? null);
    const initialRole: Role = ((): Role => {
        const r = searchParams?.get("role");
        return r === "partner" ? "partner" : "contributor";
    })();
    const toast = useToast();
    const [role, setRole] = useState<Role>(initialRole);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hasError, setHasError] = useState(false);
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setHasError(false);
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed.");
            setSuccess(data.message || "Registration received. Wait for admin activation.");
            toast.success("Registration submitted.");
            setName("");
            setEmail("");
            setPassword("");
        } catch (err) {
            setHasError(true);
            toast.error((err as Error).message);
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <span className="login-logo">NADI</span>
                    <span className="login-logo-sub">Account Registration</span>
                </div>
                {success ? (
                    <div style={{ padding: "1rem", background: "rgba(40,140,80,0.1)", border: "1px solid rgba(40,140,80,0.25)", borderRadius: 4, color: "#1a7a3e", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        ✓ {success}
                    </div>
                ) : (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 1rem", lineHeight: 1.55 }}>
                            Apply for a NADI account. Pick the account type that fits your relationship with NADI. After registering, an admin reviews and activates your access — you&apos;ll get an email once approved.
                        </p>
                        <div className="form-group" role="radiogroup" aria-label="Account type">
                            <label style={{ marginBottom: "0.5rem" }}>I am a…</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                {ROLE_OPTIONS.map((opt) => {
                                    const active = role === opt.key;
                                    return (
                                        <label
                                            key={opt.key}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.2rem",
                                                padding: "0.7rem 0.85rem",
                                                border: `1px solid ${active ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                                                borderRadius: 4,
                                                background: active ? "rgba(139,28,28,0.06)" : "#fff",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={opt.key}
                                                checked={active}
                                                onChange={() => setRole(opt.key)}
                                                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: active ? "var(--crimson, #8B1C1C)" : "inherit" }}>
                                                {opt.label}
                                            </span>
                                            <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>
                                                {opt.tagline}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-name">{role === "partner" ? "Full Name / Contact Person" : "Full Name"}</label>
                            <input
                                type="text"
                                id="reg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className={`form-group${hasError ? " field-error" : ""}`}>
                            <label htmlFor="reg-email" className={hasError ? "field-error-label" : ""}>
                                {role === "partner" ? "Email (organisation)" : "Email Address"}
                            </label>
                            <input
                                type="email"
                                id="reg-email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (hasError) setHasError(false); }}
                                required
                                placeholder="you@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <PasswordInput
                                id="reg-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <button type="submit" className="btn-primary login-submit" disabled={loading}>
                            {loading ? "Sending..." : `Request ${role === "partner" ? "Partner" : "Contributor"} Account`}
                        </button>
                    </form>
                )}
                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Already have an account?{" "}
                    <a
                        href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                        style={{ color: "var(--crimson)", fontWeight: 600 }}
                    >
                        Sign in
                    </a>
                </div>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
