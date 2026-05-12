"use client";

import { AUTHORSHIP_RULES } from "@/data/policy-products";

interface AuthorshipAckProps {
    /** Tuple of 3 booleans — one per rule */
    values: [boolean, boolean, boolean];
    onChange: (next: [boolean, boolean, boolean]) => void;
}

export default function AuthorshipAck({ values, onChange }: AuthorshipAckProps) {
    const handleToggle = (idx: 0 | 1 | 2) => {
        const next: [boolean, boolean, boolean] = [...values];
        next[idx] = !next[idx];
        onChange(next);
    };

    return (
        <div className="authorship-ack" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div
                style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                }}
            >
                Authorship &amp; Research Integrity *
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {AUTHORSHIP_RULES.map((rule, idx) => {
                    const i = idx as 0 | 1 | 2;
                    return (
                        <label
                            key={idx}
                            style={{
                                display: "flex",
                                gap: "0.6rem",
                                alignItems: "flex-start",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={values[i]}
                                onChange={() => handleToggle(i)}
                                style={{ marginTop: "0.25rem", flexShrink: 0 }}
                            />
                            <span>{rule}</span>
                        </label>
                    );
                })}
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
                All three must be acknowledged before submitting.
            </div>
        </div>
    );
}
