"use client";

interface WordCounterProps {
    /** The plain text of the editor body (not HTML). */
    text: string;
    /** From POLICY_PRODUCTS[type].wordCount — null means open-ended upper bound */
    min: number;
    max: number | null;
}

export default function WordCounter({ text, min, max }: WordCounterProps) {
    const count = text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length;

    const underMin = count < min;
    const overMax = max !== null && count > max;
    const withinRange = !underMin && !overMax;

    let color = "var(--muted)";
    if (withinRange && count > 0) {
        color = "inherit";
    } else if (underMin) {
        color = "#b45309"; // amber
    } else if (overMax) {
        color = "var(--crimson)";
    }

    return (
        <div
            className="word-counter"
            style={{
                display: "flex",
                gap: "1rem",
                fontSize: "0.8rem",
                color: "var(--muted)",
                alignItems: "baseline",
            }}
        >
            <span style={{ fontWeight: withinRange && count > 0 ? 700 : 400, color }}>
                {count} words
            </span>
            <span>
                target: {min}–{max ?? "∞"}
            </span>
        </div>
    );
}
