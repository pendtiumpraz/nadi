"use client";

import { useEffect } from "react";

interface AiDisclosureFieldProps {
    value: string;
    onChange: (next: string) => void;
    /** When true, the textarea is hidden and the value is forced to "" */
    noAi: boolean;
    onNoAiChange: (next: boolean) => void;
}

export default function AiDisclosureField({
    value,
    onChange,
    noAi,
    onNoAiChange,
}: AiDisclosureFieldProps) {
    // When "no AI" is checked, ensure value is cleared.
    useEffect(() => {
        if (noAi && value !== "") {
            onChange("");
        }
    }, [noAi, value, onChange]);

    return (
        <div className="ai-disclosure" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div
                style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                }}
            >
                AI Disclosure *
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>
                Per the Authorship clause, disclose when and which parts of your work used
                AI (drafting, data analysis, translation, editing, etc.) — or confirm you
                did not use AI.
            </div>

            <label
                style={{
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                }}
            >
                <input
                    type="checkbox"
                    checked={noAi}
                    onChange={(e) => onNoAiChange(e.target.checked)}
                />
                <span>I did not use any AI tools for this work</span>
            </label>

            {!noAi && (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    placeholder="e.g. ChatGPT used for drafting outline; data analysis performed manually."
                    style={{
                        width: "100%",
                        fontFamily: "inherit",
                        fontSize: "0.875rem",
                        padding: "0.6rem 0.75rem",
                        border: "1px solid var(--line)",
                        borderRadius: "4px",
                        resize: "vertical",
                    }}
                />
            )}
        </div>
    );
}
