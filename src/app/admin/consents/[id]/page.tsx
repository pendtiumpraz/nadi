import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import ConsentDocumentActions from "./ConsentDocumentActions";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

interface ConsentAuthor {
    surnameFirstName?: string;
    affiliation?: string;
}

interface ConsentRecord {
    id: number;
    article_slug: string;
    title_of_paper: string;
    authors: ConsentAuthor[] | unknown;
    signatory_full_name: string;
    signatory_signature_url: string | null;
    signatory_date: string;
    ack_ethical: boolean;
    ack_original: boolean;
    ack_edited: boolean;
    ack_ai_disclosure: boolean;
    ack_may_reject: boolean;
    ack_no_liability: boolean;
    agree_on_behalf: boolean;
    created_at: string;
}

// Mirrors the docx clauses verbatim — items 1-4 are author declarations,
// 5-6 are NADI's locked terms, 7 is the on-behalf-of-co-authors effect clause.
const AUTHOR_CLAUSES: { key: "ack_ethical" | "ack_original" | "ack_edited" | "ack_ai_disclosure"; text: string }[] = [
    { key: "ack_ethical", text: "The policy product has been developed in an ethical, responsible manner and in compliance with the code of scientific research ethics;" },
    { key: "ack_original", text: "The policy product meets basic publication standards, is original and free of plagiarism;" },
    { key: "ack_edited", text: "The policy product has been edited in accordance with the guidelines and revisions imposed by the quality control team;" },
    { key: "ack_ai_disclosure", text: "The policy product has used artificial intelligence (AI) tools in a responsible and transparent manner, with all AI-assisted content reviewed and verified by the author;" },
];

const NADI_TERMS_CLAUSES: { key: "ack_may_reject" | "ack_no_liability"; text: string }[] = [
    { key: "ack_may_reject", text: "The author(s) agree that the NADI Quality Control team may reject the paper if it violates any of the above declarations (Nos. 1–4) or contains deficiencies." },
    { key: "ack_no_liability", text: "The author(s) agree that NADI assumes no responsibility for the content, accuracy, or opinions expressed in the policy paper, which remain solely the responsibility of the author(s)." },
];

function formatLongDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function parseAuthors(value: unknown): ConsentAuthor[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as ConsentAuthor[];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as ConsentAuthor[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function CheckBox({ checked }: { checked: boolean }) {
    return (
        <span
            aria-label={checked ? "checked" : "unchecked"}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 14,
                height: 14,
                border: "1.5px solid #2a2a2a",
                marginRight: "0.5rem",
                marginTop: 3,
                flexShrink: 0,
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1,
            }}
        >
            {checked ? "✓" : ""}
        </span>
    );
}

export default async function ConsentDetailPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canReview(session.user)) redirect("/admin");

    const { id } = await params;
    const consentId = Number(id);

    if (!Number.isFinite(consentId) || consentId <= 0) {
        return (
            <div className="admin-body">
                <h1 className="admin-page-title">Consent-to-Publish Form</h1>
                <p style={{ color: "var(--muted)", marginTop: "1.5rem" }}>Consent form not found.</p>
                <p style={{ marginTop: "1rem" }}>
                    <a href="/admin/consents" style={{ color: "var(--crimson)", textDecoration: "none", fontWeight: 600 }}>
                        ← Back to list
                    </a>
                </p>
            </div>
        );
    }

    const sql = getDB();
    const rows = await sql`
        SELECT id, article_slug, title_of_paper, authors,
               signatory_full_name, signatory_signature_url, signatory_date,
               ack_ethical, ack_original, ack_edited, ack_ai_disclosure,
               ack_may_reject, ack_no_liability, agree_on_behalf, created_at
        FROM article_consents WHERE id = ${consentId}
    `;

    if (rows.length === 0) {
        return (
            <div className="admin-body">
                <h1 className="admin-page-title">Consent-to-Publish Form</h1>
                <p style={{ color: "var(--muted)", marginTop: "1.5rem" }}>Consent form not found.</p>
                <p style={{ marginTop: "1rem" }}>
                    <a href="/admin/consents" style={{ color: "var(--crimson)", textDecoration: "none", fontWeight: 600 }}>
                        ← Back to list
                    </a>
                </p>
            </div>
        );
    }

    const c = rows[0] as unknown as ConsentRecord;
    const authors = parseAuthors(c.authors);

    return (
        <div className="admin-body">
            {/* Header bar — hidden on print so the printed PDF is just the document */}
            <div className="consent-doc-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div>
                    <h1 className="admin-page-title" style={{ margin: 0 }}>Consent-to-Publish Form</h1>
                    <p className="admin-page-desc" style={{ margin: "0.25rem 0 0" }}>
                        Article <code>{c.article_slug}</code> · Submitted {formatDateTime(c.created_at)}
                    </p>
                </div>
                <ConsentDocumentActions consentId={c.id} articleSlug={c.article_slug} />
            </div>

            {/* The document — styled to look like a printed A4 page */}
            <div
                className="consent-doc-page"
                style={{
                    margin: "0 auto",
                    background: "#fff",
                    color: "#1a1a1a",
                    border: "1px solid #d8d4cc",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    maxWidth: 820,
                    minHeight: "1100px",
                    padding: "60px 72px",
                    fontFamily: "Georgia, 'Times New Roman', Times, serif",
                    fontSize: "10.5pt",
                    lineHeight: 1.55,
                }}
            >
                {/* NADI letterhead — color logo image, top-left. */}
                <div style={{ marginBottom: "2rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo-nadi-color.png"
                        alt="NADI — Advancing Development & Innovation"
                        style={{ height: 64, width: "auto", display: "block" }}
                    />
                </div>

                {/* Document title */}
                <h2
                    style={{
                        fontFamily: "Georgia, 'Times New Roman', Times, serif",
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        marginTop: 0,
                        marginBottom: "0.25rem",
                    }}
                >
                    Consent-to-Publish Form
                </h2>
                <p style={{ textAlign: "center", color: "#555", margin: "0 0 2rem", fontSize: "0.85rem" }}>
                    NADI — Network for Advancing Development &amp; Innovation in Health · 2026
                </p>

                <p style={{ marginBottom: "1.25rem" }}>
                    I, the undersigned, hereby confirm that I consent to publish my submitted policy
                    product and declare that:
                </p>

                {/* Author declarations 1-4 */}
                <ol start={1} style={{ paddingLeft: 0, listStyle: "none", marginBottom: "1.25rem" }}>
                    {AUTHOR_CLAUSES.map((clause, idx) => {
                        const checked = Boolean(c[clause.key]);
                        return (
                            <li
                                key={clause.key}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    marginBottom: "0.55rem",
                                }}
                            >
                                <CheckBox checked={checked} />
                                <span>
                                    <strong style={{ marginRight: "0.35rem" }}>{idx + 1}.</strong>
                                    {clause.text}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                {/* NADI terms 5-6 */}
                <p style={{ fontStyle: "italic", color: "#555", margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>
                    NADI Standard Terms (accepted on submission):
                </p>
                <ol start={5} style={{ paddingLeft: 0, listStyle: "none", marginBottom: "1.5rem" }}>
                    {NADI_TERMS_CLAUSES.map((clause, idx) => {
                        const checked = Boolean(c[clause.key]);
                        return (
                            <li
                                key={clause.key}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    marginBottom: "0.55rem",
                                }}
                            >
                                <CheckBox checked={checked} />
                                <span>
                                    <strong style={{ marginRight: "0.35rem" }}>{idx + 5}.</strong>
                                    {clause.text}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                {/* Effect clause */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: "1.75rem",
                        padding: "0.75rem 0",
                        borderTop: "1px solid #d8d4cc",
                        borderBottom: "1px solid #d8d4cc",
                    }}
                >
                    <CheckBox checked={Boolean(c.agree_on_behalf)} />
                    <span>
                        This consent and the above declarations take effect upon signature by at least one author,
                        who signs on behalf of all co-authors, if applicable.{" "}
                        <strong>I confirm I sign on behalf of all co-authors.</strong>
                    </span>
                </div>

                {/* Title of the paper */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Title of the paper
                    </div>
                    <div
                        style={{
                            borderBottom: "1px solid #1a1a1a",
                            padding: "0.4rem 0",
                            fontSize: "1.05rem",
                            fontStyle: c.title_of_paper ? "normal" : "italic",
                            color: c.title_of_paper ? "#1a1a1a" : "#888",
                        }}
                    >
                        {c.title_of_paper || "—"}
                    </div>
                </div>

                {/* Authors table */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Authors
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                        <thead>
                            <tr>
                                <th style={tableHead}>#</th>
                                <th style={{ ...tableHead, width: "45%" }}>Surname, First name</th>
                                <th style={{ ...tableHead }}>Affiliation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authors.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ ...tableCell, fontStyle: "italic", color: "#888" }}>No authors recorded.</td>
                                </tr>
                            ) : (
                                authors.map((a, i) => (
                                    <tr key={i}>
                                        <td style={tableCell}>{i + 1}.</td>
                                        <td style={tableCell}>{a.surnameFirstName || "—"}</td>
                                        <td style={tableCell}>{a.affiliation || "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Signature block */}
                <div style={{ marginTop: "2.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Signed by
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "flex-end" }}>
                        {/* Signature image */}
                        <div>
                            <div style={{ minHeight: 110, borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "flex-end", paddingBottom: "0.25rem" }}>
                                {c.signatory_signature_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={c.signatory_signature_url}
                                        alt={`Signature of ${c.signatory_full_name}`}
                                        style={{ maxHeight: 110, maxWidth: "100%", display: "block" }}
                                    />
                                ) : (
                                    <span style={{ fontStyle: "italic", color: "#888" }}>No signature on file</span>
                                )}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.3rem" }}>Signature</div>
                        </div>

                        {/* Date */}
                        <div>
                            <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "0.4rem", minHeight: 110, display: "flex", alignItems: "flex-end" }}>
                                <span style={{ fontSize: "1.05rem" }}>{formatLongDate(c.signatory_date)}</span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.3rem" }}>Date</div>
                        </div>
                    </div>

                    {/* Full name */}
                    <div style={{ marginTop: "1.25rem" }}>
                        <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0.4rem 0", fontSize: "1.05rem" }}>
                            {c.signatory_full_name || "—"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.3rem" }}>Full name of the signatory</div>
                    </div>
                </div>

                <p style={{ textAlign: "center", marginTop: "3rem", fontSize: "0.78rem", color: "#888" }}>
                    Form submitted {formatDateTime(c.created_at)} · Reference ID {c.id}
                </p>
            </div>

            <style>{`
                @media print {
                    body { background: #fff !important; }
                    .adm-topbar, .adm-sidebar, .consent-doc-toolbar { display: none !important; }
                    .admin-body { margin: 0 !important; padding: 0 !important; }
                    .consent-doc-page { box-shadow: none !important; border: none !important; max-width: 100% !important; }
                }
            `}</style>
        </div>
    );
}

const tableHead: React.CSSProperties = {
    border: "1px solid #1a1a1a",
    padding: "6px 10px",
    textAlign: "left",
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 700,
    background: "#f5f2ed",
};

const tableCell: React.CSSProperties = {
    border: "1px solid #1a1a1a",
    padding: "6px 10px",
    verticalAlign: "top",
};
