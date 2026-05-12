"use client";

import { useEffect, useState } from "react";

/**
 * Tiny inline markdown renderer — handles:
 *  - `#  heading`  → <h1>
 *  - `## heading`  → <h2>
 *  - `### heading` → <h3>
 *  - blank-line-separated paragraphs
 *  - single newlines inside a paragraph → <br/>
 *
 * Returns a list of React nodes. Intentionally minimal — the privacy text is
 * authored by NADI admins, no need for full CommonMark.
 */
function renderMarkdown(src: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const blocks = src.replace(/\r\n/g, "\n").split(/\n{2,}/);
    blocks.forEach((rawBlock, i) => {
        const block = rawBlock.trim();
        if (!block) return;
        if (block.startsWith("### ")) {
            nodes.push(
                <h3 key={i} style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0.75rem 0 0.35rem" }}>
                    {block.slice(4)}
                </h3>,
            );
            return;
        }
        if (block.startsWith("## ")) {
            nodes.push(
                <h2 key={i} style={{ fontSize: "1rem", fontWeight: 700, margin: "0.85rem 0 0.4rem" }}>
                    {block.slice(3)}
                </h2>,
            );
            return;
        }
        if (block.startsWith("# ")) {
            nodes.push(
                <h1 key={i} style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0.9rem 0 0.45rem" }}>
                    {block.slice(2)}
                </h1>,
            );
            return;
        }
        // Paragraph — split single newlines into <br/>.
        const lines = block.split("\n");
        nodes.push(
            <p key={i} style={{ margin: "0 0 0.6rem" }}>
                {lines.map((ln, j) => (
                    <span key={j}>
                        {ln}
                        {j < lines.length - 1 ? <br /> : null}
                    </span>
                ))}
            </p>,
        );
    });
    return nodes;
}

const FALLBACK_BODY = `## Ketentuan dan Kebijakan Privasi NADI

Selamat datang di NADI. Dengan mengakses atau menggunakan situs ini, Anda menyetujui Ketentuan Penggunaan dan Kebijakan Privasi kami.

## Pengumpulan Data
Kami dapat mengumpulkan data terbatas seperti alamat IP, jenis peramban, dan halaman yang Anda kunjungi untuk meningkatkan layanan.

## Penggunaan Data
Data yang dikumpulkan digunakan untuk keperluan analitik, peningkatan konten, dan komunikasi yang relevan. Kami tidak menjual data Anda kepada pihak ketiga.

## Hak Anda
Anda berhak mengajukan permintaan akses, perbaikan, atau penghapusan data pribadi Anda kapan saja melalui kanal kontak resmi NADI.`;

export default function PrivacyPopup() {
    const [visible, setVisible] = useState(false);
    const [body, setBody] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            if (window.localStorage.getItem("privacy_ack")) return;
            if (window.sessionStorage.getItem("privacy_dismissed") === "1") return;
        } catch {
            // localStorage blocked (incognito strict / SSR edge) — still show.
        }
        let cancelled = false;
        (async () => {
            let md = FALLBACK_BODY;
            try {
                const res = await fetch("/api/settings", { cache: "no-store" });
                if (res.ok) {
                    const data = (await res.json()) as { settings?: Record<string, string> };
                    const fromDb = data?.settings?.privacy_terms_md;
                    if (typeof fromDb === "string" && fromDb.trim().length > 0) {
                        md = fromDb;
                    }
                }
            } catch {
                // network failure — fall back to default copy.
            }
            if (cancelled) return;
            setBody(md);
            setVisible(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!visible) return null;

    const onDismiss = () => {
        try {
            window.sessionStorage.setItem("privacy_dismissed", "1");
        } catch {
            // ignore — closing is best-effort.
        }
        setVisible(false);
    };

    const onAccept = async () => {
        if (submitting) return;
        setSubmitting(true);
        const token =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        try {
            await fetch("/api/privacy-consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
        } catch {
            // Network failure shouldn't block the user from dismissing.
        }
        try {
            window.localStorage.setItem("privacy_ack", token);
        } catch {
            // ignore
        }
        setSubmitting(false);
        setVisible(false);
    };

    return (
        <>
            <style>{`
                .nadi-privacy-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .nadi-privacy-card {
                    background: #fff;
                    width: calc(100% - 2rem);
                    max-width: 480px;
                    max-height: 80vh;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
                    display: flex;
                    flex-direction: column;
                    color: #1a1a1a;
                    font-family: inherit;
                }
                .nadi-privacy-title {
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin: 0 0 0.85rem;
                    line-height: 1.35;
                }
                .nadi-privacy-callout {
                    background: #F7F3EE;
                    border-left: 3px solid var(--crimson, #8B1C1C);
                    padding: 0.75rem 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    color: #3a2f2f;
                }
                .nadi-privacy-body {
                    max-height: 50vh;
                    overflow-y: auto;
                    font-size: 0.85rem;
                    line-height: 1.6;
                    color: #333;
                    padding-right: 0.25rem;
                }
                .nadi-privacy-body h1,
                .nadi-privacy-body h2,
                .nadi-privacy-body h3 {
                    color: #1a1a1a;
                }
                .nadi-privacy-footer {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    justify-content: flex-end;
                }
                .nadi-privacy-btn {
                    padding: 0.6rem 1rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid transparent;
                    line-height: 1;
                    transition: opacity 0.15s ease;
                }
                .nadi-privacy-btn:disabled {
                    opacity: 0.6;
                    cursor: progress;
                }
                .nadi-privacy-btn--outline {
                    background: transparent;
                    border: 1px solid var(--line, #DDDAD6);
                    color: #444;
                }
                .nadi-privacy-btn--primary {
                    background: var(--crimson, #8B1C1C);
                    color: #fff;
                    border-color: var(--crimson, #8B1C1C);
                }
                @media (max-width: 600px) {
                    .nadi-privacy-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                    .nadi-privacy-card {
                        width: 100%;
                        max-width: 100%;
                        max-height: 85vh;
                        border-radius: 8px 8px 0 0;
                    }
                }
            `}</style>
            <div
                className="nadi-privacy-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nadi-privacy-title"
            >
                <div className="nadi-privacy-card">
                    <h2 id="nadi-privacy-title" className="nadi-privacy-title">
                        Konfirmasi Ketentuan dan Kebijakan Privasi
                    </h2>
                    <div className="nadi-privacy-callout">
                        Dengan klik <strong>Setujui Semua</strong>, saya telah membaca dan menyetujui Ketentuan
                        dan Kebijakan Privasi NADI.
                    </div>
                    <div className="nadi-privacy-body">{renderMarkdown(body)}</div>
                    <div className="nadi-privacy-footer">
                        <button
                            type="button"
                            className="nadi-privacy-btn nadi-privacy-btn--outline"
                            onClick={onDismiss}
                            disabled={submitting}
                        >
                            Nanti Saja
                        </button>
                        <button
                            type="button"
                            className="nadi-privacy-btn nadi-privacy-btn--primary"
                            onClick={onAccept}
                            disabled={submitting}
                        >
                            {submitting ? "Memproses…" : "Setujui Semua"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
