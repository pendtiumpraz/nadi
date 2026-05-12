"use client";

import { useRef, useState, FormEvent, useMemo } from "react";

export interface ConsentFormPayload {
    ackEthical: boolean;
    ackOriginal: boolean;
    ackEdited: boolean;
    ackAiDisclosure: boolean;
    ackMayReject: boolean;
    ackNoLiability: boolean;
    agreeOnBehalf: boolean;
    titleOfPaper: string;
    authors: { surnameFirstName: string; affiliation: string }[];
    signatoryFullName: string;
    signatorySignatureUrl: string;
    signatoryDate: string;
}

interface ConsentFormProps {
    /** Prefill: article title, current user's name/email for author row 1 */
    prefill?: Partial<ConsentFormPayload>;
    /** When user submits the form. Should return a Promise that resolves on success.
     *  If it rejects, the error message is shown inline and the form stays editable. */
    onSubmit: (payload: ConsentFormPayload) => Promise<void>;
    /** When user uploads a signature image. Should return the URL string. */
    onUploadSignature: (file: File) => Promise<string>;
}

const CLAUSES: { key: keyof ConsentFormPayload; text: string }[] = [
    {
        key: "ackEthical",
        text:
            "The policy product has been developed in an ethical, responsible manner and in compliance with the code of scientific research ethics;",
    },
    {
        key: "ackOriginal",
        text:
            "The policy product meets basic publication standards, is original and free of plagiarism;",
    },
    {
        key: "ackEdited",
        text:
            "The policy product has been edited in accordance with the guidelines and revisions imposed by the quality control team;",
    },
    {
        key: "ackAiDisclosure",
        text:
            "The policy product has used artificial intelligence (AI) tools in a responsible and transparent manner, with all AI-assisted content reviewed and verified by the author;",
    },
    {
        key: "ackMayReject",
        text:
            "The author(s) agree that the NADI Quality Control team may reject the paper if it violates any of the above declarations (Nos. 1–4) or contains deficiencies.",
    },
    {
        key: "ackNoLiability",
        text:
            "The author(s) agree that NADI assumes no responsibility for the content, accuracy, or opinions expressed in the policy paper, which remain solely the responsibility of the author(s)",
    },
];

const today = () => new Date().toISOString().split("T")[0];

export default function ConsentForm({
    prefill,
    onSubmit,
    onUploadSignature,
}: ConsentFormProps): React.JSX.Element {
    const initialAuthors = useMemo(() => {
        if (prefill?.authors && prefill.authors.length > 0) return prefill.authors;
        return [{ surnameFirstName: "", affiliation: "" }];
    }, [prefill?.authors]);

    const [ackEthical, setAckEthical] = useState(!!prefill?.ackEthical);
    const [ackOriginal, setAckOriginal] = useState(!!prefill?.ackOriginal);
    const [ackEdited, setAckEdited] = useState(!!prefill?.ackEdited);
    const [ackAiDisclosure, setAckAiDisclosure] = useState(!!prefill?.ackAiDisclosure);
    const [ackMayReject, setAckMayReject] = useState(!!prefill?.ackMayReject);
    const [ackNoLiability, setAckNoLiability] = useState(!!prefill?.ackNoLiability);
    const [agreeOnBehalf, setAgreeOnBehalf] = useState(!!prefill?.agreeOnBehalf);

    const [titleOfPaper, setTitleOfPaper] = useState(prefill?.titleOfPaper || "");
    const [authors, setAuthors] = useState<{ surnameFirstName: string; affiliation: string }[]>(initialAuthors);
    const [signatoryFullName, setSignatoryFullName] = useState(prefill?.signatoryFullName || "");
    const [signatorySignatureUrl, setSignatorySignatureUrl] = useState(prefill?.signatorySignatureUrl || "");
    const [signatoryDate, setSignatoryDate] = useState(prefill?.signatoryDate || today());

    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [signatureError, setSignatureError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const signatureInputRef = useRef<HTMLInputElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const firstAuthorNameRef = useRef<HTMLInputElement>(null);
    const fullNameRef = useRef<HTMLInputElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);
    const declarationsRef = useRef<HTMLDivElement>(null);

    const clauseState: Record<string, [boolean, (v: boolean) => void]> = {
        ackEthical: [ackEthical, setAckEthical],
        ackOriginal: [ackOriginal, setAckOriginal],
        ackEdited: [ackEdited, setAckEdited],
        ackAiDisclosure: [ackAiDisclosure, setAckAiDisclosure],
        ackMayReject: [ackMayReject, setAckMayReject],
        ackNoLiability: [ackNoLiability, setAckNoLiability],
    };

    const updateAuthor = (idx: number, patch: Partial<{ surnameFirstName: string; affiliation: string }>) => {
        setAuthors((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    };

    const addAuthor = () => {
        setAuthors((prev) => [...prev, { surnameFirstName: "", affiliation: "" }]);
    };

    const removeAuthor = (idx: number) => {
        setAuthors((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    };

    const handleSignatureChange = async (file: File | undefined) => {
        if (!file) return;
        setSignatureError("");
        const isImage = /image\/(jpeg|jpg|png)/i.test(file.type) || /\.(jpe?g|png)$/i.test(file.name);
        if (!isImage) {
            setSignatureError("Please upload a JPG or PNG image.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setSignatureError("Signature image is too large. Max 2MB.");
            return;
        }
        setUploadingSignature(true);
        try {
            const url = await onUploadSignature(file);
            setSignatorySignatureUrl(url);
        } catch (err) {
            setSignatureError((err as Error).message || "Upload failed.");
        } finally {
            setUploadingSignature(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        const missing: string[] = [];
        let firstMissingRef: React.RefObject<HTMLElement | null> | null = null;

        const allDeclarations = ackEthical && ackOriginal && ackEdited && ackAiDisclosure && ackMayReject && ackNoLiability;
        if (!allDeclarations) {
            missing.push("All six declaration checkboxes must be ticked.");
            if (!firstMissingRef) firstMissingRef = declarationsRef;
        }
        if (!agreeOnBehalf) {
            missing.push("You must confirm you sign on behalf of all co-authors.");
            if (!firstMissingRef) firstMissingRef = declarationsRef;
        }
        if (!titleOfPaper.trim()) {
            missing.push("Title of the paper is required.");
            if (!firstMissingRef) firstMissingRef = titleRef;
        }
        const firstAuthor = authors[0];
        if (!firstAuthor || !firstAuthor.surnameFirstName.trim() || !firstAuthor.affiliation.trim()) {
            missing.push("At least one author with full name and affiliation is required.");
            if (!firstMissingRef) firstMissingRef = firstAuthorNameRef;
        }
        if (!signatoryFullName.trim()) {
            missing.push("Signatory full name is required.");
            if (!firstMissingRef) firstMissingRef = fullNameRef;
        }
        if (!signatorySignatureUrl) {
            missing.push("Please upload your e-signature image.");
            if (!firstMissingRef) firstMissingRef = signatureInputRef;
        }
        if (!signatoryDate) {
            missing.push("Signature date is required.");
            if (!firstMissingRef) firstMissingRef = dateRef;
        }

        if (missing.length > 0) {
            setErrorMessage(missing.join(" "));
            if (firstMissingRef && firstMissingRef.current) {
                firstMissingRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                if (typeof (firstMissingRef.current as HTMLInputElement).focus === "function") {
                    try { (firstMissingRef.current as HTMLInputElement).focus({ preventScroll: true }); } catch { /* ignore */ }
                }
            }
            return;
        }

        const payload: ConsentFormPayload = {
            ackEthical,
            ackOriginal,
            ackEdited,
            ackAiDisclosure,
            ackMayReject,
            ackNoLiability,
            agreeOnBehalf,
            titleOfPaper: titleOfPaper.trim(),
            authors: authors.map((a) => ({
                surnameFirstName: a.surnameFirstName.trim(),
                affiliation: a.affiliation.trim(),
            })),
            signatoryFullName: signatoryFullName.trim(),
            signatorySignatureUrl,
            signatoryDate,
        };

        setSubmitting(true);
        try {
            await onSubmit(payload);
        } catch (err) {
            setErrorMessage((err as Error).message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: 820,
                margin: "0 auto",
                padding: "2.5rem 1.5rem 3rem",
                color: "var(--ink, #1a1a1a)",
            }}
        >
            <h1
                style={{
                    fontFamily: "'Playfair Display', 'Times New Roman', Georgia, serif",
                    fontSize: "2.1rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginBottom: "1.5rem",
                    color: "var(--ink, #1a1a1a)",
                }}
            >
                Consent-to-Publish Form &mdash; 2026
            </h1>

            <p
                style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "var(--ink, #1a1a1a)",
                    marginBottom: "1.5rem",
                }}
            >
                I, the undersigned, hereby confirm that I consent to publish my submitted policy product and declare that:
            </p>

            <form onSubmit={handleSubmit} noValidate>
                {/* Six declarations */}
                <div
                    ref={declarationsRef}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    {CLAUSES.map((clause, idx) => {
                        const [checked, setChecked] = clauseState[clause.key as string];
                        return (
                            <label
                                key={clause.key}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.75rem",
                                    padding: "0.85rem 1rem",
                                    border: `1px solid ${checked ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                                    borderRadius: 4,
                                    background: checked ? "rgba(139,28,28,0.04)" : "transparent",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    fontSize: "0.88rem",
                                    lineHeight: 1.55,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => setChecked(e.target.checked)}
                                    style={{ marginTop: 3, accentColor: "#8B1C1C", flexShrink: 0 }}
                                />
                                <span>
                                    <span style={{ fontWeight: 600, marginRight: "0.4rem" }}>{idx + 1}.</span>
                                    {clause.text}
                                </span>
                            </label>
                        );
                    })}
                </div>

                <hr
                    style={{
                        border: "none",
                        borderTop: "1px solid var(--line, #ddd)",
                        margin: "2rem 0",
                    }}
                />

                {/* Effect clause */}
                <label
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        border: `1px solid ${agreeOnBehalf ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                        borderRadius: 4,
                        background: agreeOnBehalf ? "rgba(139,28,28,0.04)" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        marginBottom: "2rem",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={agreeOnBehalf}
                        onChange={(e) => setAgreeOnBehalf(e.target.checked)}
                        style={{ marginTop: 3, accentColor: "#8B1C1C", flexShrink: 0 }}
                    />
                    <span>
                        This consent and the above declarations take effect upon signature by at least one author, who signs on behalf of all co-authors, if applicable.
                        {" — "}
                        <strong>I confirm I sign on behalf of all co-authors.</strong>
                    </span>
                </label>

                {/* Title of the paper */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <label
                        htmlFor="cf-title"
                        style={{
                            display: "block",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginBottom: "0.4rem",
                            color: "var(--ink, #1a1a1a)",
                        }}
                    >
                        Title of the paper <span style={{ color: "var(--crimson, #8B1C1C)" }}>*</span>
                    </label>
                    <input
                        id="cf-title"
                        ref={titleRef}
                        type="text"
                        value={titleOfPaper}
                        onChange={(e) => setTitleOfPaper(e.target.value)}
                        placeholder="e.g. Health Financing Sustainability in Post-Pandemic Indonesia"
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid var(--line, #ddd)",
                            borderRadius: 4,
                            fontSize: "0.9rem",
                            background: "var(--bg, #fff)",
                            color: "var(--ink, #1a1a1a)",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* Authors */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <div
                        style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginBottom: "0.6rem",
                            color: "var(--ink, #1a1a1a)",
                        }}
                    >
                        Authors <span style={{ color: "var(--crimson, #8B1C1C)" }}>*</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {authors.map((author, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    ref={idx === 0 ? firstAuthorNameRef : undefined}
                                    type="text"
                                    placeholder="Surname, First name"
                                    value={author.surnameFirstName}
                                    onChange={(e) => updateAuthor(idx, { surnameFirstName: e.target.value })}
                                    style={{
                                        flex: 1,
                                        padding: "8px 10px",
                                        border: "1px solid var(--line, #ddd)",
                                        borderRadius: 4,
                                        fontSize: "0.88rem",
                                        background: "var(--bg, #fff)",
                                        color: "var(--ink, #1a1a1a)",
                                        boxSizing: "border-box",
                                        minWidth: 0,
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Affiliation"
                                    value={author.affiliation}
                                    onChange={(e) => updateAuthor(idx, { affiliation: e.target.value })}
                                    style={{
                                        flex: 1,
                                        padding: "8px 10px",
                                        border: "1px solid var(--line, #ddd)",
                                        borderRadius: 4,
                                        fontSize: "0.88rem",
                                        background: "var(--bg, #fff)",
                                        color: "var(--ink, #1a1a1a)",
                                        boxSizing: "border-box",
                                        minWidth: 0,
                                    }}
                                />
                                {authors.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAuthor(idx)}
                                        className="btn-outline"
                                        style={{
                                            fontSize: "0.78rem",
                                            padding: "6px 12px",
                                            color: "#c44",
                                            flexShrink: 0,
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: "0.6rem" }}>
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={addAuthor}
                            style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                        >
                            + Add another author
                        </button>
                    </div>
                </div>

                {/* E-signature */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <div
                        style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginBottom: "0.4rem",
                            color: "var(--ink, #1a1a1a)",
                        }}
                    >
                        E-signature <span style={{ color: "var(--crimson, #8B1C1C)" }}>*</span>
                    </div>
                    <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                        onChange={(e) => handleSignatureChange(e.target.files?.[0])}
                        disabled={uploadingSignature}
                        style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.4rem" }}
                    />
                    <p style={{ fontSize: "0.78rem", color: "var(--muted, #777)", margin: "0 0 0.5rem" }}>
                        Upload a PNG or JPG of your handwritten signature. Max 2MB.
                    </p>
                    {uploadingSignature && (
                        <p style={{ fontSize: "0.8rem", color: "var(--muted, #777)", margin: "0.25rem 0" }}>
                            Uploading signature...
                        </p>
                    )}
                    {signatureError && (
                        <p style={{ fontSize: "0.8rem", color: "#c44", margin: "0.25rem 0" }}>{signatureError}</p>
                    )}
                    {signatorySignatureUrl && !uploadingSignature && (
                        <div style={{ marginTop: "0.6rem" }}>
                            <img
                                src={signatorySignatureUrl}
                                alt="Signature preview"
                                style={{
                                    maxHeight: 100,
                                    maxWidth: "100%",
                                    border: "1px solid var(--line, #ddd)",
                                    borderRadius: 4,
                                    padding: 6,
                                    background: "#fff",
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Full Name + Date */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginBottom: "2rem",
                    }}
                >
                    <div>
                        <label
                            htmlFor="cf-fullname"
                            style={{
                                display: "block",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginBottom: "0.4rem",
                                color: "var(--ink, #1a1a1a)",
                            }}
                        >
                            Full Name <span style={{ color: "var(--crimson, #8B1C1C)" }}>*</span>
                        </label>
                        <input
                            id="cf-fullname"
                            ref={fullNameRef}
                            type="text"
                            value={signatoryFullName}
                            onChange={(e) => setSignatoryFullName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                border: "1px solid var(--line, #ddd)",
                                borderRadius: 4,
                                fontSize: "0.9rem",
                                background: "var(--bg, #fff)",
                                color: "var(--ink, #1a1a1a)",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="cf-date"
                            style={{
                                display: "block",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                marginBottom: "0.4rem",
                                color: "var(--ink, #1a1a1a)",
                            }}
                        >
                            Date <span style={{ color: "var(--crimson, #8B1C1C)" }}>*</span>
                        </label>
                        <input
                            id="cf-date"
                            ref={dateRef}
                            type="date"
                            value={signatoryDate}
                            onChange={(e) => setSignatoryDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                border: "1px solid var(--line, #ddd)",
                                borderRadius: 4,
                                fontSize: "0.9rem",
                                background: "var(--bg, #fff)",
                                color: "var(--ink, #1a1a1a)",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </div>

                {errorMessage && (
                    <div
                        role="alert"
                        style={{
                            background: "rgba(196,68,68,0.08)",
                            border: "1px solid rgba(196,68,68,0.35)",
                            borderRadius: 4,
                            padding: "0.75rem 1rem",
                            marginBottom: "1rem",
                            fontSize: "0.85rem",
                            color: "#8a2929",
                            lineHeight: 1.5,
                        }}
                    >
                        {errorMessage}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{
                        width: "100%",
                        padding: "12px 20px",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        background: "var(--crimson, #8B1C1C)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.7 : 1,
                        letterSpacing: "0.02em",
                    }}
                >
                    {submitting ? "Submitting…" : "Submit Consent Form"}
                </button>

                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.78rem",
                        color: "var(--muted, #777)",
                        marginTop: "1.5rem",
                        marginBottom: 0,
                    }}
                >
                    &copy; 2026 NADI. All rights reserved.
                </p>
            </form>
        </div>
    );
}
