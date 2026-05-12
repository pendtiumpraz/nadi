"use client";

import { useCallback, useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";

type AuthorRole = "admin" | "reviewer" | "contributor" | "partner";

interface Comment {
    id: string;
    body: string;
    authorId: string;
    authorRole: AuthorRole;
    authorName: string;
    createdAt: string;
}

interface CommentThreadProps {
    slug: string;
    /** Visual title. Default "Comments" */
    title?: string;
    /** Optional callback after a successful post (so parent can refresh article state, e.g. feedback_pending). */
    onPosted?: () => void;
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

export default function CommentThread({ slug, title = "Comments", onPosted }: CommentThreadProps): JSX.Element {
    const { data: session } = useSession();
    const currentRole = (session?.user as { role?: AuthorRole } | undefined)?.role;

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`/api/articles/${slug}/comments`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
            setComments(Array.isArray(data.comments) ? data.comments : []);
        } catch (err) {
            setLoadError((err as Error).message);
        }
        setLoading(false);
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    const submit = useCallback(async () => {
        const trimmed = body.trim();
        if (!trimmed || submitting) return;
        setSubmitting(true);
        setPostError(null);
        try {
            const res = await fetch(`/api/articles/${slug}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
            if (data?.comment) {
                setComments((prev) => [...prev, data.comment as Comment]);
            }
            setBody("");
            onPosted?.();
        } catch (err) {
            setPostError((err as Error).message);
        }
        setSubmitting(false);
    }, [body, slug, submitting, onPosted]);

    const onTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
        }
    };

    const trimmedEmpty = body.trim().length === 0;

    const hint =
        currentRole === "reviewer"
            ? "Leave a note for the author or fellow reviewers."
            : currentRole === "admin"
                ? "Add an editorial note. Visible to reviewers and the author."
                : currentRole === "contributor"
                    ? "Reply to feedback or add context for the reviewer."
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
                <p style={{ color: "var(--muted)" }}>Loading comments...</p>
            ) : loadError ? (
                <p style={{ color: "#a83838" }}>Failed to load comments: {loadError}</p>
            ) : comments.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    No comments yet. Start the conversation.
                </p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {comments.map((c) => {
                        const roleStyle = ROLE_STYLES[c.authorRole] ?? ROLE_STYLES.partner;
                        return (
                            <li
                                key={c.id}
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
                                    <span style={{ fontWeight: 700 }}>{c.authorName}</span>
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
                                        {c.authorRole}
                                    </span>
                                    <span
                                        title={new Date(c.createdAt).toLocaleString()}
                                        style={{ color: "var(--muted)", fontSize: "0.75rem", marginLeft: "auto" }}
                                    >
                                        {formatRelative(c.createdAt)}
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
                                    {c.body}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <div style={{ marginTop: "1.25rem" }}>
                <label htmlFor="comment-body" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
                    Write a comment
                </label>
                <textarea
                    id="comment-body"
                    ref={textareaRef}
                    aria-label="Write a comment"
                    value={body}
                    onChange={(e) => {
                        setBody(e.target.value);
                        if (postError) setPostError(null);
                    }}
                    onKeyDown={onTextareaKeyDown}
                    placeholder="Write a comment..."
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
                        {submitting ? "Posting..." : "Post comment"}
                    </button>
                </div>
            </div>
        </section>
    );
}
