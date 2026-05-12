"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "@/components/Pagination";

const PER_PAGE = 20;

interface ConsentRow {
    id: number;
    articleSlug: string;
    titleOfPaper: string;
    signatoryFullName: string;
    signatoryDate: string;
    createdAt: string;
    authors?: { surnameFirstName?: string; affiliation?: string }[];
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminConsentsList() {
    const [consents, setConsents] = useState<ConsentRow[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [msg, setMsg] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/consents");
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Failed to load consents");
            setConsents(d.consents || []);
        } catch (err) {
            setMsg((err as Error).message);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading submitted consent forms...</p>;

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            {consents && consents.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "1.5rem" }}>
                    No consent forms submitted yet.
                </p>
            ) : (
                <section style={{ marginTop: "1.5rem" }}>
                    <h2
                        style={{
                            fontSize: "1rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--muted)",
                            marginBottom: "0.75rem",
                        }}
                    >
                        Consent Forms ({consents?.length ?? 0})
                    </h2>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Signatory</th>
                                <th>Date</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(consents || []).slice((page - 1) * PER_PAGE, page * PER_PAGE).map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <a
                                            href={`/admin/consents/${c.id}`}
                                            style={{ color: "var(--crimson)", textDecoration: "none", fontWeight: 600 }}
                                        >
                                            {c.titleOfPaper}
                                        </a>
                                    </td>
                                    <td>{c.signatoryFullName}</td>
                                    <td>{formatDate(c.signatoryDate)}</td>
                                    <td>{formatDate(c.createdAt)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <a
                                                className="admin-btn"
                                                href={`/admin/consents/${c.id}`}
                                                style={{ background: "var(--crimson)", color: "#fff", textDecoration: "none" }}
                                            >
                                                View consent
                                            </a>
                                            <a
                                                className="admin-btn admin-btn--secondary"
                                                href={`/admin/articles/${c.articleSlug}`}
                                                style={{ textDecoration: "none" }}
                                            >
                                                Open article
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        page={page}
                        total={consents?.length || 0}
                        perPage={PER_PAGE}
                        onPageChange={setPage}
                        itemLabel="consent forms"
                    />
                </section>
            )}
        </div>
    );
}
