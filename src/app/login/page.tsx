"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";

// Only allow same-origin relative paths in callbackUrl — never let an
// attacker craft /login?callbackUrl=https://evil.example.
function safeRedirect(value: string | null): string {
    if (!value) return "/admin";
    if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
    return value;
}

// Next 15+ requires useSearchParams() readers to live under a Suspense
// boundary so the page can stream past the search-params hydration point.
export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = safeRedirect(searchParams?.get("callbackUrl") ?? null);
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
                toast.error("Akun kamu belum diaktivasi oleh admin. Kamu akan menerima email konfirmasi setelah akun diaktivasi.");
            } else if (code?.includes("ACCOUNT_SUSPENDED")) {
                setErrorField("account");
                toast.error("Akun kamu telah dinonaktifkan. Silakan hubungi administrator.");
            } else if (code?.includes("THROTTLED")) {
                const seconds = Number(code.split(":")[1]) || 0;
                const mins = Math.ceil(seconds / 60);
                const wait = seconds < 60 ? `${seconds} detik` : mins === 1 ? "sekitar 1 menit" : `${mins} menit`;
                setErrorField("credentials");
                toast.error(`Terlalu banyak percobaan gagal. Coba lagi dalam ${wait}.`);
            } else {
                setErrorField("credentials");
                toast.error("Email atau password salah.");
            }
        } else {
            router.push(callbackUrl);
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
                        <PasswordInput
                            id="login-password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (errorField !== "none") setErrorField("none"); }}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div style={{ textAlign: "right", marginTop: "-0.4rem", marginBottom: "0.4rem" }}>
                        <a href="/forgot-password" style={{ color: "var(--crimson)", fontSize: "0.8rem", textDecoration: "none" }}>
                            Forgot password?
                        </a>
                    </div>
                    <button type="submit" className="btn-primary login-submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                    Don&apos;t have an account?{" "}
                    <a
                        href={`/register?role=contributor${callbackUrl !== "/admin" ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                        style={{ color: "var(--crimson)", fontWeight: 600 }}
                    >
                        Register as Contributor
                    </a>
                    {" or "}
                    <a
                        href={`/register?role=partner${callbackUrl !== "/admin" ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                        style={{ color: "var(--crimson)", fontWeight: 600 }}
                    >
                        Partner
                    </a>
                </div>
                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
