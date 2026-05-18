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
    // When "no AI" is on, ensure the textarea value is cleared.
    useEffect(() => {
        if (noAi && value !== "") {
            onChange("");
        }
    }, [noAi, value, onChange]);

    // UI-flipped state: the toggle reads "Used AI tools" because that's the
    // intuitive mental model. Internally `noAi` stays so the rest of the
    // editor + save payload don't need to change.
    const usedAi = !noAi;
    const toggle = () => onNoAiChange(usedAi); // if currently using AI, flip to noAi=true

    return (
        <div className="ai-disclosure" style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
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
                Per the Authorship clause, disclose whether you used any AI tools
                (drafting, data analysis, translation, editing, etc.) and which parts
                were AI-assisted.
            </div>

            {/* Sliding toggle — same visual language as the AI Magazine Style
                switch at the top of the editor so the affordance feels familiar. */}
            <button
                type="button"
                role="switch"
                aria-checked={usedAi}
                onClick={toggle}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.55rem 0.85rem",
                    border: `1px solid ${usedAi ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                    borderRadius: 30,
                    background: usedAi ? "rgba(139,28,28,0.06)" : "transparent",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: usedAi ? "var(--crimson, #8B1C1C)" : "var(--muted)",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.15s",
                }}
            >
                <span
                    aria-hidden
                    style={{
                        position: "relative",
                        width: 36,
                        height: 20,
                        borderRadius: 10,
                        background: usedAi ? "#8B1C1C" : "#bbb",
                        transition: "background 0.15s",
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            top: 2,
                            left: usedAi ? 18 : 2,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.15s",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                        }}
                    />
                </span>
                <span style={{ flex: 1 }}>
                    {usedAi ? "I used AI tools for this work" : "I did not use any AI tools"}
                </span>
            </button>

            {usedAi && (
                <div>
                    <label
                        htmlFor="ai-disclosure-detail"
                        style={{
                            display: "block",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "var(--ink, #1a1a1a)",
                            marginBottom: "0.35rem",
                        }}
                    >
                        Describe how AI was used <span style={{ color: "var(--crimson)" }}>*</span>
                    </label>
                    <textarea
                        id="ai-disclosure-detail"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        placeholder="e.g. ChatGPT used to draft the outline and translate citations; data analysis performed manually."
                        style={{
                            width: "100%",
                            fontFamily: "inherit",
                            fontSize: "0.875rem",
                            padding: "0.6rem 0.75rem",
                            border: "1px solid var(--line)",
                            borderRadius: 4,
                            resize: "vertical",
                            boxSizing: "border-box",
                        }}
                    />
                    <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "0.3rem 0 0", lineHeight: 1.45 }}>
                        Disclose which parts (drafting, editing, translation, analysis…) were AI-assisted so reviewers know what to fact-check.
                    </p>
                </div>
            )}
        </div>
    );
}
