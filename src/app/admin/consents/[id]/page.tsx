import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";

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

const ACK_CLAUSES: { key: keyof Pick<
    ConsentRecord,
    "ack_ethical" | "ack_original" | "ack_edited" | "ack_ai_disclosure" | "ack_may_reject" | "ack_no_liability" | "agree_on_behalf"
>; text: string }[] = [
    { key: "ack_ethical", text: "The policy product has been developed in an ethical, responsible manner and in compliance with the code of scientific research ethics" },
    { key: "ack_original", text: "The policy product meets basic publication standards, is original and free of plagiarism" },
    { key: "ack_edited", text: "The policy product has been edited in accordance with the guidelines and revisions imposed by the quality control team" },
    { key: "ack_ai_disclosure", text: "The policy product has used AI tools in a responsible and transparent manner, with all AI-assisted content reviewed and verified by the author" },
    { key: "ack_may_reject", text: "The author(s) agree that the NADI Quality Control team may reject the paper if it violates any of the above declarations" },
    { key: "ack_no_liability", text: "NADI assumes no responsibility for the content, accuracy, or opinions" },
    { key: "agree_on_behalf", text: "I sign on behalf of all co-authors" },
];

function formatDate(value: string | null | undefined): string {
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

const sectionLabelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--muted)",
    fontWeight: 700,
    marginBottom: "0.4rem",
};

const sectionStyle: React.CSSProperties = {
    marginTop: "1.75rem",
    paddingBottom: "1.25rem",
    borderBottom: "1px solid #e5e2dc",
};

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
            <h1 className="admin-page-title">Consent-to-Publish Form</h1>
            <p className="admin-page-desc">
                Signed submission for article <code>{c.article_slug}</code>.
            </p>

            <div
                style={{
                    marginTop: "1.5rem",
                    padding: "2rem",
                    background: "#fff",
                    border: "1px solid #e5e2dc",
                    borderRadius: 4,
                    maxWidth: 820,
                }}
            >
                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Title of the paper</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 600 }}>{c.title_of_paper}</div>
                </section>

                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Authors</div>
                    {authors.length === 0 ? (
                        <div style={{ color: "var(--muted)" }}>No authors recorded.</div>
                    ) : (
                        <ol style={{ paddingLeft: "1.25rem", margin: 0 }}>
                            {authors.map((a, i) => (
                                <li key={i} style={{ marginBottom: "0.35rem" }}>
                                    <strong>{a.surnameFirstName || "—"}</strong>
                                    {a.affiliation ? ` — ${a.affiliation}` : ""}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Signatory full name</div>
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>{c.signatory_full_name}</div>
                </section>

                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Signature</div>
                    {c.signatory_signature_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={c.signatory_signature_url}
                            alt={`Signature of ${c.signatory_full_name}`}
                            style={{ maxHeight: 120, maxWidth: "100%", display: "block", background: "#fafaf7", padding: "0.5rem", border: "1px solid #eee" }}
                        />
                    ) : (
                        <div style={{ color: "var(--muted)" }}>No signature image on file.</div>
                    )}
                </section>

                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Signature date</div>
                    <div>{formatDate(c.signatory_date)}</div>
                </section>

                <section style={sectionStyle}>
                    <div style={sectionLabelStyle}>Acknowledgements</div>
                    <ol style={{ paddingLeft: "1.25rem", margin: 0 }}>
                        {ACK_CLAUSES.map(({ key, text }) => {
                            const checked = Boolean(c[key]);
                            return (
                                <li key={key} style={{ marginBottom: "0.6rem", lineHeight: 1.45 }}>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: "1.5rem",
                                            color: checked ? "#1a7a3e" : "var(--crimson)",
                                            fontWeight: 700,
                                        }}
                                        aria-label={checked ? "agreed" : "not agreed"}
                                    >
                                        {checked ? "✓" : "✗"}
                                    </span>
                                    <span>{text}</span>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                <section style={{ ...sectionStyle, borderBottom: "none" }}>
                    <div style={sectionLabelStyle}>Submitted at</div>
                    <div>{formatDateTime(c.created_at)}</div>
                </section>
            </div>

            <div className="admin-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                    href="/admin/consents"
                    className="admin-btn admin-btn--secondary"
                    style={{ textDecoration: "none" }}
                >
                    ← Back to list
                </a>
                <a
                    href={`/admin/articles/${c.article_slug}`}
                    className="admin-btn"
                    style={{ background: "var(--crimson)", color: "#fff", textDecoration: "none" }}
                >
                    Open article →
                </a>
            </div>
        </div>
    );
}
