"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";
import { PUBLIC_REGISTRATION_ROLES } from "@/lib/role-config";

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

// Role catalogue for the public register form. The list mirrors
// PUBLIC_REGISTRATION_ROLES from lib/role-config so re-introducing a role
// (e.g. 'partner' later) means dropping it into both lists with a tagline
// here — no other code changes required.
const ROLE_DESCRIPTIONS: Record<string, { label: string; tagline: string }> = {
    contributor: {
        label: "Contributor",
        tagline: "Writer / researcher who drafts policy products inside the NADI CMS.",
    },
    partner: {
        label: "Partner",
        tagline: "External organization submitting policy products for NADI review and publication.",
    },
};

const ROLE_OPTIONS = PUBLIC_REGISTRATION_ROLES.map((key) => ({
    key,
    label: ROLE_DESCRIPTIONS[key]?.label || key,
    tagline: ROLE_DESCRIPTIONS[key]?.tagline || "",
}));

function RegisterPageInner() {
    const searchParams = useSearchParams();
    const callbackUrl = safeRedirect(searchParams?.get("callbackUrl") ?? null);
    // Default to whatever URL hint we received, falling back to the first
    // allowed role. When only one role is allowed (current state) the picker
    // collapses to a single-line summary instead of a radio group.
    const initialRole: string = ((): string => {
        const r = searchParams?.get("role");
        if (r && PUBLIC_REGISTRATION_ROLES.includes(r as never)) return r;
        return PUBLIC_REGISTRATION_ROLES[0] || "contributor";
    })();
    const toast = useToast();
    const [role, setRole] = useState<string>(initialRole);
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

    const onlyOneRole = ROLE_OPTIONS.length <= 1;
    const activeOption = ROLE_OPTIONS.find((o) => o.key === role) || ROLE_OPTIONS[0];

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
                            Apply for a NADI account. After registering, an admin reviews and activates your access — you&apos;ll get an email once approved.
                        </p>
                        {onlyOneRole && activeOption ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                    padding: "0.7rem 0.85rem",
                                    border: "1px solid var(--crimson, #8B1C1C)",
                                    borderRadius: 4,
                                    background: "rgba(139,28,28,0.06)",
                                    marginBottom: "1rem",
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--crimson, #8B1C1C)" }}>
                                    {activeOption.label} account
                                </span>
                                {activeOption.tagline && (
                                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>
                                        {activeOption.tagline}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="form-group" role="radiogroup" aria-label="Account type">
                                <label style={{ marginBottom: "0.5rem" }}>I am a…</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
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
                        )}
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
                        <div className={`form-group${hasError ? " field-error" : ""}`}>
                            <label htmlFor="reg-email" className={hasError ? "field-error-label" : ""}>
                                Email Address
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
                            {loading ? "Sending..." : `Request ${activeOption?.label || "Contributor"} Account`}
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
