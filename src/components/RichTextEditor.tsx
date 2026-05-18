"use client";

import * as React from "react";
import { promptDialog } from "@/components/Toast";

interface RichTextEditorProps {
    /** Initial HTML, set once on mount. Subsequent `value` changes from the
     *  parent are ignored unless `resetKey` changes — that's intentional, so
     *  controlled re-renders don't lose the user's cursor. */
    value: string;
    /** Called on every input with the latest innerHTML. */
    onChange: (html: string) => void;
    /** Bump this prop (e.g. with a counter) when the parent wants to force a
     *  re-seed of the editor (used by the "Reset to default" button). */
    resetKey?: number;
    placeholder?: string;
    minHeight?: number;
}

interface ToolbarButtonProps {
    label: string;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}

function ToolbarButton({ title, label, onClick, children }: ToolbarButtonProps): React.JSX.Element {
    return (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            aria-label={label}
            className="rte-btn"
        >
            {children}
        </button>
    );
}

/**
 * Lightweight WYSIWYG editor backed by contentEditable. Toolbar covers the
 * formatting the legal pages need (headings, bold/italic, lists, links,
 * blockquote, divider). Output is plain HTML stored in DB — no markdown
 * conversion required.
 */
export default function RichTextEditor({ value, onChange, resetKey, placeholder, minHeight = 400 }: RichTextEditorProps): React.JSX.Element {
    const ref = React.useRef<HTMLDivElement | null>(null);

    // Seed innerHTML on mount + whenever resetKey bumps. We intentionally
    // skip re-syncing on every `value` change so typing doesn't fight the
    // cursor — the parent reads from onChange instead.
    React.useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    React.useEffect(() => {
        if (!ref.current) return;
        if (ref.current.innerHTML.trim() === "") {
            ref.current.innerHTML = value;
        }
        // Initial mount only — we never re-sync after to preserve cursor.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exec = React.useCallback((cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        ref.current?.focus();
        onChange(ref.current?.innerHTML || "");
    }, [onChange]);

    const insertLink = async () => {
        const url = await promptDialog({
            title: "Insert link",
            message: "Paste the URL to link the selected text.",
            placeholder: "https://example.com",
        });
        if (url) exec("createLink", url);
    };

    return (
        <div>
            <div className="rte-toolbar">
                <div className="rte-toolbar-group">
                    <ToolbarButton label="Bold" title="Bold (Ctrl+B)" onClick={() => exec("bold")}>
                        <b>B</b>
                    </ToolbarButton>
                    <ToolbarButton label="Italic" title="Italic (Ctrl+I)" onClick={() => exec("italic")}>
                        <i>I</i>
                    </ToolbarButton>
                    <ToolbarButton label="Underline" title="Underline (Ctrl+U)" onClick={() => exec("underline")}>
                        <u>U</u>
                    </ToolbarButton>
                </div>
                <div className="rte-toolbar-group">
                    <ToolbarButton label="Heading 2" title="Section heading" onClick={() => exec("formatBlock", "H2")}>
                        H2
                    </ToolbarButton>
                    <ToolbarButton label="Heading 3" title="Sub-heading" onClick={() => exec("formatBlock", "H3")}>
                        H3
                    </ToolbarButton>
                    <ToolbarButton label="Paragraph" title="Plain paragraph" onClick={() => exec("formatBlock", "P")}>
                        ¶
                    </ToolbarButton>
                </div>
                <div className="rte-toolbar-group">
                    <ToolbarButton label="Bullet list" title="Bullet list" onClick={() => exec("insertUnorderedList")}>
                        •
                    </ToolbarButton>
                    <ToolbarButton label="Numbered list" title="Numbered list" onClick={() => exec("insertOrderedList")}>
                        1.
                    </ToolbarButton>
                    <ToolbarButton label="Blockquote" title="Blockquote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}>
                        &ldquo;
                    </ToolbarButton>
                </div>
                <div className="rte-toolbar-group">
                    <ToolbarButton label="Insert link" title="Insert link" onClick={insertLink}>
                        🔗
                    </ToolbarButton>
                    <ToolbarButton label="Divider" title="Horizontal rule" onClick={() => exec("insertHorizontalRule")}>
                        —
                    </ToolbarButton>
                    <ToolbarButton label="Clear formatting" title="Clear formatting" onClick={() => exec("removeFormat")}>
                        ✕
                    </ToolbarButton>
                </div>
            </div>
            <div
                ref={ref}
                className="rte-content"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder || "Start writing here…"}
                onInput={() => onChange(ref.current?.innerHTML || "")}
                style={{ minHeight, maxHeight: 640, overflowY: "auto" }}
            />
        </div>
    );
}
