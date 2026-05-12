"use client";

import { useCallback, useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";

type AuthorRole = "admin" | "reviewer" | "contributor" | "partner";

interface TopicMessage {
    id: string;
    body: string;
    authorId: string | null;
    authorRole: AuthorRole | null;
    authorName: string | null;
    createdAt: string;
}

interface TopicChatProps {
    topicId: number | string;
    /** Visual title. Default "Discussion" */
    title?: string;
}

const ROLE_STYLES: Record<AuthorRole, { bg: string; color: string }> = {
    admin: { bg: "rgba(139,28,28,0.12)", color: "#8B1C1C" },
    reviewer: { bg: "rgba(220,150,40,0.15)", color: "#9a6a10" },
    contributor: { bg: "rgba(40,90,180,0.12)", color: "#2a5aa8" },
    partner: { bg: "rgba(120,120,120,0.15)", color: "#555" },
};

function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const now = Date.now();
    const diffMs = now - then;
    const sec = Math.floor(diffMs / 1000);

    if (sec < 5) return "just now";
    if (sec < 60) return `${sec} second${sec === 1 ? "" : "s"} ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;

    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;

    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const POLL_INTERVAL_MS = 15000;

export default function TopicChat({ topicId, title = "Discussion" }: TopicChatProps): JSX.Element {
    const { data: session } = useSession();
    const currentRole = (session?.user as { role?: AuthorRole } | undefined)?.role;

    const [messages, setMessages] = useState<TopicMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const load = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            if (!silent) setLoadError(null);
            try {
                const res = await fetch(`/api/topics/${topicId}/messages`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                if (silent) setLoadError(null);
            } catch (err) {
                if (!silent) setLoadError((err as Error).message);
            }
            if (!silent) setLoading(false);
        },
        [topicId]
    );

    // Initial load + 15s poll while mounted.
    useEffect(() => {
        let cancelled = false;
        void load();
        const t = setInterval(() => {
            if (!cancelled) void load(true);
        }, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(t);
        };
    }, [load]);

    const submit = useCallback(async () => {
        const trimmed = body.trim();
        if (!trimmed || submitting) return;
        setSubmitting(true);
        setPostError(null);
        try {
            const res = await fetch(`/api/topics/${topicId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
            if (data?.message) {
                setMessages((prev) => [...prev, data.message as TopicMessage]);
            }
            setBody("");
        } catch (err) {
            setPostError((err as Error).message);
        }
        setSubmitting(false);
    }, [body, topicId, submitting]);

    const onTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
        }
    };

    const trimmedEmpty = body.trim().length === 0;

    const hint =
        currentRole === "reviewer"
            ? "Discuss this topic with admins and contributors before it's assigned."
            : currentRole === "admin"
                ? "Curate the discussion. Visible to reviewers and contributors."
                : currentRole === "contributor"
                    ? "Share context or pitch yourself for this topic."
                    : "";

    return (
        <section style={{ marginTop: "2rem" }}>
            <h2
                style={{
                    fontSize: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--muted)",
                    marginBottom: "0.75rem",
                }}
            >
                {title}
            </h2>

            {loading ? (
                <p style={{ color: "var(--muted)" }}>Loading discussion...</p>
            ) : loadError ? (
                <p style={{ color: "#a83838" }}>Failed to load discussion: {loadError}</p>
            ) : messages.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    No messages yet. Start the conversation.
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {messages.map((m) => {
                        const role = (m.authorRole ?? "partner") as AuthorRole;
                        const roleStyle = ROLE_STYLES[role] ?? ROLE_STYLES.partner;
                        return (
                            <li
                                key={m.id}
                                style={{
                                    border: "1px solid var(--line)",
                                    borderRadius: 6,
                                    padding: "0.85rem 1rem",
                                    background: "#fff",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        marginBottom: "0.4rem",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span style={{ fontWeight: 700 }}>{m.authorName || "Unknown"}</span>
                                    <span
                                        style={{
                                            display: "inline-block",
                                            padding: "2px 8px",
                                            borderRadius: 12,
                                            fontSize: "0.65rem",
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                            background: roleStyle.bg,
                                            color: roleStyle.color,
                                        }}
                                    >
                                        {role}
                                    </span>
                                    <span
                                        title={new Date(m.createdAt).toLocaleString()}
                                        style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "auto" }}
                                    >
                                        {formatRelative(m.createdAt)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        fontSize: "0.9rem",
                                        lineHeight: 1.5,
                                        color: "var(--ink, #1a1a1a)",
                                    }}
                                >
                                    {m.body}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {currentRole !== "partner" && (
                <div style={{ marginTop: "1.25rem" }}>
                    <label
                        htmlFor="topic-message-body"
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: "hidden",
                            clip: "rect(0,0,0,0)",
                            whiteSpace: "nowrap",
                            border: 0,
                        }}
                    >
                        Write a message
                    </label>
                    <textarea
                        id="topic-message-body"
                        ref={textareaRef}
                        aria-label="Write a message"
                        value={body}
                        onChange={(e) => {
                            setBody(e.target.value);
                            if (postError) setPostError(null);
                        }}
                        onKeyDown={onTextareaKeyDown}
                        placeholder="Write a message..."
                        disabled={submitting}
                        style={{
                            width: "100%",
                            minHeight: 60,
                            padding: "0.6rem 0.75rem",
                            border: "1px solid var(--line)",
                            borderRadius: 6,
                            fontFamily: "inherit",
                            fontSize: "0.9rem",
                            lineHeight: 1.5,
                            resize: "vertical",
                            background: submitting ? "rgba(0,0,0,0.02)" : "#fff",
                            boxSizing: "border-box",
                        }}
                    />
                    {postError && (
                        <p style={{ color: "#a83838", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>
                            Failed to post: {postError}
                        </p>
                    )}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            marginTop: "0.6rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                            {hint}
                            {hint ? " " : ""}
                            <span style={{ opacity: 0.7 }}>Tip: Ctrl/Cmd + Enter to post.</span>
                        </span>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => void submit()}
                            disabled={submitting || trimmedEmpty}
                        >
                            {submitting ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
