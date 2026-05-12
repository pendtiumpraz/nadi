"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ConsentForm, { type ConsentFormPayload } from "@/components/ConsentForm";

// ════════════════════════════════════════════════════════════════════
// /consent/[slug]
// ────────────────────────────────────────────────────────────────────
// Token-gated, public consent-to-publish form. Reached via the email
// sent on admin Approve: ${baseUrl}/consent/[slug]?token=...
// Intentionally renders without the global Navbar/Footer — it's a slim,
// single-purpose page for an outside contributor.
// ════════════════════════════════════════════════════════════════════

interface Prefill {
    titleOfPaper: string;
    authors: string[];
}

interface VerifyOk {
    ok: true;
    prefill: Prefill;
}
interface VerifyErr {
    ok: false;
    reason?: string;
}
type VerifyResponse = VerifyOk | VerifyErr;

export default function ConsentPage() {
    const router = useRouter();
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const slug = params?.slug ?? "";
    const token = searchParams?.get("token") ?? "";

    const [loading, setLoading] = useState(true);
    const [prefill, setPrefill] = useState<Prefill | null>(null);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        if (!slug || !token) {
            setInvalid(true);
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `/api/consent/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`,
                    { cache: "no-store" }
                );
                const data: VerifyResponse = await res.json().catch(() => ({ ok: false }));
                if (cancelled) return;
                if (res.ok && data.ok) {
                    setPrefill(data.prefill);
                } else {
                    setInvalid(true);
                }
            } catch {
                if (!cancelled) setInvalid(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [slug, token]);

    const handleUploadSignature = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload/signature", { method: "POST", body: fd });
        if (!res.ok) {
            let msg = "Signature upload failed.";
            try {
                const j = await res.json();
                if (j?.error) msg = String(j.error);
            } catch {
                /* ignore */
            }
            throw new Error(msg);
        }
        const data = (await res.json()) as { url?: string };
        if (!data?.url) throw new Error("Upload did not return a URL.");
        return data.url;
    };

    const handleSubmit = async (payload: ConsentFormPayload): Promise<void> => {
        const res = await fetch(
            `/api/consent/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
            throw new Error(data.error || "Failed to submit consent form. Please try again.");
        }
        router.push(`/consent/${slug}/done`);
    };

    return (
        <div style={pageWrap}>
            <header style={brandBar}>
                <a href="/" style={wordmarkLink} aria-label="NADI home">
                    <span style={wordmark}>NADI</span>
                </a>
            </header>

            <main style={shell}>
                {loading && (
                    <div style={statusBox}>
                        <p style={statusMuted}>Verifying your consent link…</p>
                    </div>
                )}

                {!loading && invalid && (
                    <div style={statusBox}>
                        <h1 style={errorHeading}>This link is no longer valid</h1>
                        <p style={errorBody}>
                            This consent link is invalid or has expired. Please contact the NADI
                            team to receive a fresh link.
                        </p>
                        <a href="/" style={backLink}>
                            ← Back to NADI
                        </a>
                    </div>
                )}

                {!loading && !invalid && prefill && (
                    <ConsentForm
                        prefill={{
                            titleOfPaper: prefill.titleOfPaper,
                            authors:
                                prefill.authors && prefill.authors.length > 0
                                    ? prefill.authors.map((a) => ({
                                          surnameFirstName: a,
                                          affiliation: "",
                                      }))
                                    : undefined,
                        }}
                        onSubmit={handleSubmit}
                        onUploadSignature={handleUploadSignature}
                    />
                )}
            </main>
        </div>
    );
}

// ── inline styles — match the v2 light theme used by /login ──

const pageWrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#FAFAF8",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1A1A1A",
};

const brandBar: React.CSSProperties = {
    padding: "1.75rem 2rem 1rem",
    textAlign: "center",
    borderBottom: "1px solid #EDEAE5",
};

const wordmarkLink: React.CSSProperties = {
    textDecoration: "none",
    color: "inherit",
};

const wordmark: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "1.75rem",
    fontWeight: 400,
    letterSpacing: "0.22em",
    color: "#8B1C1C",
};

const shell: React.CSSProperties = {
    flex: 1,
    width: "100%",
    maxWidth: 820,
    margin: "0 auto",
    padding: "2.5rem 1.5rem 4rem",
    boxSizing: "border-box",
};

const statusBox: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E8E5E1",
    padding: "2.5rem 2rem",
    textAlign: "center",
};

const statusMuted: React.CSSProperties = {
    margin: 0,
    fontSize: "0.95rem",
    color: "#6B6B6B",
};

const errorHeading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 400,
    fontSize: "1.85rem",
    margin: "0 0 0.75rem",
    color: "#1A1A1A",
};

const errorBody: React.CSSProperties = {
    margin: "0 0 1.5rem",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "#4A4A4A",
};

const backLink: React.CSSProperties = {
    display: "inline-block",
    fontSize: "0.85rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8B1C1C",
    textDecoration: "none",
    borderBottom: "1px solid #8B1C1C",
    paddingBottom: 2,
};
