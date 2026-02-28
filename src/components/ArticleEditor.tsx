"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ArticleEditorProps {
    slug?: string;
}

export default function ArticleEditor({ slug }: ArticleEditorProps) {
    const router = useRouter();
    const isEdit = !!slug;

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("POLICY BRIEF");
    const [author, setAuthor] = useState("NADI Research Team");
    const [readTime, setReadTime] = useState("8 min read");
    const [coverColor, setCoverColor] = useState("crimson");
    const [seoDesc, setSeoDesc] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [formatting, setFormatting] = useState(false);

    // Load existing article for editing
    useEffect(() => {
        if (!isEdit) return;
        fetch(`/api/articles?slug=${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.title) {
                    setTitle(data.title);
                    setCategory(data.category || "POLICY BRIEF");
                    setAuthor(data.author || "NADI Research Team");
                    setReadTime(data.readTime || "8 min read");
                    setCoverColor(data.coverColor || "crimson");
                    setSeoDesc(data.seo?.description || "");
                    setSeoKeywords(data.seo?.keywords?.join(", ") || "");
                    // Convert blocks back to plain text for editing
                    if (data.blocks) {
                        const text = data.blocks
                            .map((b: Record<string, unknown>) => {
                                if (b.type === "heading") return `\n## ${b.text}\n`;
                                if (b.type === "lead" || b.type === "text" || b.type === "highlight") return b.text;
                                if (b.type === "quote") return `"${b.text}" — ${b.attribution || ""}`;
                                if (b.type === "pullquote") return `> ${b.text}`;
                                if (b.type === "callout") return `[${b.label}] ${b.text}`;
                                if (b.type === "stat") return `${b.value} — ${b.label}`;
                                if (b.type === "list") return (b.items as string[]).map((i: string) => `- ${i}`).join("\n");
                                if (b.type === "two-column") return `${b.left}\n\n${b.right}`;
                                if (b.type === "divider") return "---";
                                return (b.text as string) || "";
                            })
                            .join("\n\n");
                        setContent(text);
                    }
                }
            })
            .catch(() => setStatus("Failed to load article."));
    }, [slug, isEdit]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setStatus("Title is required."); return; }
        if (!content.trim()) { setStatus("Write some content first."); return; }

        setSaving(true);
        setFormatting(true);
        setStatus("AI is formatting your article into magazine layout...");

        try {
            // Step 1: AI formats content into blocks
            const formatRes = await fetch("/api/ai/format", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const formatData = await formatRes.json();
            if (!formatRes.ok) throw new Error(formatData.error);

            setFormatting(false);
            setStatus("Saving article...");

            // Step 2: Build article object
            const articleSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const article = {
                slug: articleSlug,
                title,
                subtitle: "",
                category,
                author,
                readTime,
                date: new Date().toISOString().split("T")[0],
                coverColor,
                seo: {
                    description: seoDesc || title,
                    keywords: seoKeywords.split(",").map((k) => k.trim()).filter(Boolean),
                },
                blocks: formatData.blocks,
            };

            // Step 3: Save
            const saveRes = await fetch("/api/articles", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(article),
            });
            const saveData = await saveRes.json();
            if (!saveRes.ok) throw new Error(saveData.error);

            setStatus(`✓ Article ${isEdit ? "updated" : "published"} successfully!`);
            if (!isEdit) {
                setTimeout(() => router.push("/admin/articles"), 1500);
            }
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
        setFormatting(false);
    };

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">{isEdit ? "Edit Article" : "Write New Article"}</h1>
            <p className="admin-page-desc">
                {isEdit
                    ? "Edit your article below. Content will be re-formatted by AI on save."
                    : "Write your article freely. AI will automatically format it into a magazine-style layout when you publish."}
            </p>

            <form onSubmit={handleSubmit} className="editor">
                {/* Meta */}
                <div className="editor-section">
                    <div className="editor-section-title">Article Details</div>
                    <div className="form-group">
                        <label htmlFor="editor-title">Title *</label>
                        <input id="editor-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Health Financing Sustainability in Post-Pandemic Indonesia" />
                    </div>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label htmlFor="editor-category">Category</label>
                            <select id="editor-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option>POLICY BRIEF</option><option>RESEARCH PAPER</option><option>STRATEGIC ANALYSIS</option>
                                <option>WORKING PAPER</option><option>RESEARCH NOTE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="editor-author">Author</label>
                            <input id="editor-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
                        </div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label htmlFor="editor-readtime">Read Time</label>
                            <input id="editor-readtime" value={readTime} onChange={(e) => setReadTime(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="editor-cover">Cover Color</label>
                            <select id="editor-cover" value={coverColor} onChange={(e) => setCoverColor(e.target.value)}>
                                <option value="crimson">Crimson</option><option value="charcoal">Charcoal</option><option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="editor-section">
                    <div className="editor-section-title">Content</div>
                    <textarea
                        className="editor-content-area"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={"Write your article here...\n\nJust write naturally — paragraphs, stats, quotes, bullet points, section headers.\n\nAI will automatically detect your content structure and format it into a beautiful magazine-style layout with varied block types (headings, pullquotes, stats, callouts, columns, etc.).\n\nTips:\n- Use ## for section headings\n- Put quotes in \"quotation marks\"\n- Mention stats like \"63% of...\" — AI will highlight them\n- Use - for bullet lists\n- Write at least a few paragraphs for best results"}
                        rows={20}
                    />
                    <p className="editor-hint">
                        ✨ AI will automatically format your text into magazine-style blocks (headings, pullquotes, stats, callouts, columns, etc.) when you publish.
                    </p>
                </div>

                {/* SEO */}
                <div className="editor-section">
                    <div className="editor-section-title">SEO Settings</div>
                    <div className="form-group">
                        <label htmlFor="editor-seo-desc">Meta Description</label>
                        <input id="editor-seo-desc" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Compelling meta description (150-160 chars)" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editor-seo-kw">Keywords (comma-separated)</label>
                        <input id="editor-seo-kw" value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="health policy, governance, UHC" />
                    </div>
                </div>

                {/* Status & Save */}
                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {formatting ? "⏳ AI Formatting..." : saving ? "Saving..." : isEdit ? "Update Article" : "Publish Article"}
                    </button>
                    <a href="/admin/articles" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
