import type { Metadata } from "next";

// ════════════════════════════════════════════════════════════════════
// /consent/[slug]/done
// ────────────────────────────────────────────────────────────────────
// Static thank-you page shown after a contributor submits the consent
// form. No global Navbar/Footer — matches the focused vibe of the
// consent form itself.
// ════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
    title: "Consent received — NADI",
    description: "Your consent form has been submitted successfully.",
    robots: { index: false, follow: false },
};

export default function ConsentDonePage() {
    return (
        <div style={pageWrap}>
            <header style={brandBar}>
                <a href="/" style={wordmarkLink} aria-label="NADI home">
                    <span style={wordmark}>NADI</span>
                </a>
            </header>

            <main style={shell}>
                <div style={card}>
                    <h1 style={heading}>Thank you</h1>
                    <p style={body}>
                        Your consent form has been submitted successfully. The NADI team will
                        publish your work shortly. You may now close this tab.
                    </p>
                    <a href="/" style={backLink}>
                        ← Back to NADI
                    </a>
                </div>
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
    padding: "3.5rem 1.5rem 4rem",
    boxSizing: "border-box",
};

const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E8E5E1",
    padding: "3rem 2.5rem",
    textAlign: "center",
};

const heading: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 400,
    fontSize: "2.75rem",
    lineHeight: 1.1,
    margin: "0 0 1.25rem",
    color: "#1A1A1A",
};

const body: React.CSSProperties = {
    margin: "0 0 2rem",
    fontSize: "1rem",
    lineHeight: 1.7,
    color: "#4A4A4A",
    maxWidth: 540,
    marginLeft: "auto",
    marginRight: "auto",
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
