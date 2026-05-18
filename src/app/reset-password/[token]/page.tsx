"use client";

import { FormEvent, useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";

interface Props {
    params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
    const { token } = use(params);
    const router = useRouter();
    const toast = useToast();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) {
            setVerifyError("This reset link is invalid.");
            setVerifying(false);
            return;
        }
        fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.ok) {
                    setVerified(true);
                } else {
                    const reason = data.reason as string | undefined;
                    setVerifyError(
                        reason === "expired"
                            ? "This reset link has expired. Please request a new one."
                            : reason === "used"
                                ? "This reset link has already been used."
                                : "This reset link is invalid."
                    );
                }
            })
            .catch(() => setVerifyError("Failed to verify the reset link. Please try again."))
            .finally(() => setVerifying(false));
    }, [token]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                setDone(true);
                toast.success("Password updated. You can now sign in.");
                setTimeout(() => router.push("/login"), 1500);
            } else {
                toast.error(data.error || "Failed to reset password.");
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
                    <span className="login-logo-sub">Reset Password</span>
                </div>

                {verifying && (
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem 0" }}>
                        Verifying reset link…
                    </p>
                )}

                {!verifying && verifyError && (
                    <div style={{ padding: "1rem", background: "rgba(196,68,68,0.08)", border: "1px solid rgba(196,68,68,0.3)", borderRadius: 4, color: "#8a2929", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        {verifyError}
                        <div style={{ marginTop: "0.75rem" }}>
                            <a href="/forgot-password" style={{ color: "var(--crimson)", fontWeight: 600 }}>Request a new reset link</a>
                        </div>
                    </div>
                )}

                {!verifying && verified && !done && (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 1rem", lineHeight: 1.55 }}>
                            Set a new password for your NADI account.
                        </p>
                        <div className="form-group">
                            <label htmlFor="rp-password">New Password</label>
                            <PasswordInput
                                id="rp-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="rp-confirm">Confirm Password</label>
                            <PasswordInput
                                id="rp-confirm"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Re-enter the new password"
                            />
                        </div>
                        <button type="submit" className="btn-primary login-submit" disabled={loading}>
                            {loading ? "Saving..." : "Set New Password"}
                        </button>
                    </form>
                )}

                {done && (
                    <div style={{ padding: "1rem", background: "rgba(40,140,80,0.1)", border: "1px solid rgba(40,140,80,0.25)", borderRadius: 4, color: "#1a7a3e", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        ✓ Password updated. Redirecting you to the sign-in page…
                    </div>
                )}

                <a href="/" className="login-back">← Back to NADI Website</a>
            </div>
        </div>
    );
}
