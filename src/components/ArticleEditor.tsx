"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ArticleEditorProps {
    slug?: string;
}

export default function ArticleEditor({ slug }: ArticleEditorProps) {
    const router = useRouter();
    const editorRef = useRef<HTMLDivElement>(null);
    const isEdit = !!slug;

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("POLICY BRIEF");
    const [author, setAuthor] = useState("NADI Research Team");
    const [readTime, setReadTime] = useState("8 min read");
    const [coverColor, setCoverColor] = useState("crimson");
    const [seoDesc, setSeoDesc] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [uploadingCover, setUploadingCover] = useState(false);
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Load existing article
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
                    setCoverImage(data.coverImage || "");
                    setSeoDesc(data.seo?.description || "");
                    setSeoKeywords(data.seo?.keywords?.join(", ") || "");
                    if (data.blocks && editorRef.current) {
                        editorRef.current.innerHTML = blocksToHTML(data.blocks);
                    }
                }
            })
            .catch(() => setStatus("Failed to load article."));
    }, [slug, isEdit]);

    // Convert blocks back to editable HTML
    const blocksToHTML = (blocks: Record<string, unknown>[]): string => {
        return blocks.map((b) => {
            switch (b.type) {
                case "heading": return `<h2>${b.text}</h2>`;
                case "lead": return `<p><strong>${b.text}</strong></p>`;
                case "text": return `<p>${b.text}</p>`;
                case "highlight": return `<p><em>${b.text}</em></p>`;
                case "quote": return `<blockquote>${b.text}${b.attribution ? ` — ${b.attribution}` : ""}</blockquote>`;
                case "pullquote": return `<blockquote><strong>${b.text}</strong></blockquote>`;
                case "callout": return `<p><strong>[${b.label}]</strong> ${b.text}</p>`;
                case "stat": return `<p><strong>${b.value}</strong> — ${b.label}</p>`;
                case "list": return `<ul>${(b.items as string[]).map((i) => `<li>${i}</li>`).join("")}</ul>`;
                case "two-column": return `<p>${b.left}</p><p>${b.right}</p>`;
                case "divider": return `<hr>`;
                default: return `<p>${b.text || ""}</p>`;
            }
        }).join("");
    };

    // Rich text commands
    const exec = useCallback((cmd: string, value?: string) => {
        document.execCommand(cmd, false, value);
        editorRef.current?.focus();
    }, []);

    const insertLink = () => {
        const url = prompt("Enter URL:");
        if (url) exec("createLink", url);
    };

    const handleCoverUpload = async (file: File) => {
        if (!file || file.size === 0) return;
        setUploadingCover(true);
        setStatus("⏳ Uploading cover image...");
        try {
            const fd = new FormData();
            fd.append("image", file);
            fd.append("slug", slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "draft");
            const res = await fetch("/api/articles/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCoverImage(data.url);
            setStatus("✓ Cover image uploaded!");
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setUploadingCover(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const content = editorRef.current?.innerText || "";
        if (!title.trim()) { setStatus("Title is required."); return; }
        if (content.trim().length < 30) { setStatus("Write some content first."); return; }

        setSaving(true);
        setStatus("⏳ AI is formatting your article into magazine layout...");

        try {
            // Step 1: Format content → blocks
            const formatRes = await fetch("/api/ai/format", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const formatData = await formatRes.json();
            if (!formatRes.ok) throw new Error(formatData.error);

            // Step 2: Auto-generate SEO if empty
            let finalSeoDesc = seoDesc;
            let finalKeywords = seoKeywords.split(",").map((k) => k.trim()).filter(Boolean);
            if (!finalSeoDesc || finalKeywords.length === 0) {
                setStatus("⏳ Generating SEO metadata...");
                const seoRes = await fetch("/api/ai/seo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, category, content: content.substring(0, 1000) }),
                });
                const seoData = await seoRes.json();
                if (seoRes.ok) {
                    if (!finalSeoDesc) finalSeoDesc = seoData.description || title;
                    if (finalKeywords.length === 0) finalKeywords = seoData.keywords || [];
                    setSeoDesc(finalSeoDesc);
                    setSeoKeywords(finalKeywords.join(", "));
                }
            }

            setStatus("⏳ Saving article...");
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
                coverImage,
                seo: { description: finalSeoDesc, keywords: finalKeywords },
                blocks: formatData.blocks,
            };

            const saveRes = await fetch("/api/articles", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(article),
            });
            const saveData = await saveRes.json();
            if (!saveRes.ok) throw new Error(saveData.error);

            setStatus(`✓ Article ${isEdit ? "updated" : "published"}!`);
            if (!isEdit) setTimeout(() => router.push("/admin/articles"), 1500);
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">{isEdit ? "Edit Article" : "Write New Article"}</h1>
            <p className="admin-page-desc">Write freely with the editor below. AI will format your content into a magazine-style layout and generate SEO metadata automatically.</p>

            <form onSubmit={handleSubmit} className="editor">
                {/* Meta */}
                <div className="editor-section">
                    <div className="editor-section-title">Article Details</div>
                    <div className="form-group">
                        <label htmlFor="ed-title">Title *</label>
                        <input id="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Health Financing Sustainability in Post-Pandemic Indonesia" />
                    </div>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label htmlFor="ed-cat">Category</label>
                            <select id="ed-cat" value={category} onChange={e => setCategory(e.target.value)}>
                                <option>POLICY BRIEF</option><option>RESEARCH PAPER</option><option>STRATEGIC ANALYSIS</option>
                                <option>WORKING PAPER</option><option>RESEARCH NOTE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="ed-author">Author</label>
                            <input id="ed-author" value={author} onChange={e => setAuthor(e.target.value)} />
                        </div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label htmlFor="ed-time">Read Time</label>
                            <input id="ed-time" value={readTime} onChange={e => setReadTime(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ed-color">Cover Color</label>
                            <select id="ed-color" value={coverColor} onChange={e => setCoverColor(e.target.value)}>
                                <option value="crimson">Crimson</option><option value="charcoal">Charcoal</option><option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="editor-section">
                    <div className="editor-section-title">Cover Image <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></div>
                    {coverImage ? (
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <img src={coverImage} alt="Cover" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>{uploadingCover ? '⏳...' : 'Change Image'}</button>
                                <button type="button" className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px', color: '#c44' }} onClick={() => setCoverImage('')}>Remove</button>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{ border: '2px dashed var(--line)', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                            onClick={() => coverInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--crimson)'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--line)'; const f = e.dataTransfer.files[0]; if (f) handleCoverUpload(f); }}
                        >
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{uploadingCover ? '⏳ Uploading...' : '📷 Click or drag image here to upload cover'}</p>
                        </div>
                    )}
                    <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
                </div>

                {/* Rich Text Editor */}
                <div className="editor-section">
                    <div className="editor-section-title">Content</div>
                    <div className="rte-toolbar">
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("bold")} title="Bold"><b>B</b></button>
                            <button type="button" className="rte-btn" onClick={() => exec("italic")} title="Italic"><i>I</i></button>
                            <button type="button" className="rte-btn" onClick={() => exec("underline")} title="Underline"><u>U</u></button>
                            <button type="button" className="rte-btn" onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "H2")} title="Heading 2">H2</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "H3")} title="Heading 3">H3</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "P")} title="Paragraph">¶</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("insertUnorderedList")} title="Bullet List">•</button>
                            <button type="button" className="rte-btn" onClick={() => exec("insertOrderedList")} title="Numbered List">1.</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="Quote">&ldquo;</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={insertLink} title="Insert Link">🔗</button>
                            <button type="button" className="rte-btn" onClick={() => exec("insertHorizontalRule")} title="Divider">—</button>
                            <button type="button" className="rte-btn" onClick={() => exec("removeFormat")} title="Clear Formatting">✕</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("justifyLeft")} title="Align Left">⫷</button>
                            <button type="button" className="rte-btn" onClick={() => exec("justifyCenter")} title="Align Center">⫿</button>
                            <button type="button" className="rte-btn" onClick={() => exec("justifyRight")} title="Align Right">⫸</button>
                        </div>
                    </div>
                    <div
                        ref={editorRef}
                        className="rte-content"
                        contentEditable
                        data-placeholder="Start writing your article here...&#10;&#10;Use the toolbar above for formatting:&#10;• Bold, Italic, Underline for emphasis&#10;• H2, H3 for section headings&#10;• Bullet / numbered lists&#10;• Blockquotes for citations&#10;• Links, dividers, and more&#10;&#10;AI will convert your formatted text into a beautiful magazine-style layout when you publish."
                        suppressContentEditableWarning
                    />
                    <p className="editor-hint">✨ AI will auto-format into magazine blocks (pullquotes, stats, callouts, columns, etc.) on publish.</p>
                </div>

                {/* SEO */}
                <div className="editor-section">
                    <div className="editor-section-title">SEO Settings <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— leave empty to auto-generate with AI</span></div>
                    <div className="form-group">
                        <label htmlFor="ed-seo-desc">Meta Description</label>
                        <input id="ed-seo-desc" value={seoDesc} onChange={e => setSeoDesc(e.target.value)} placeholder="Leave empty — AI will generate a compelling meta description" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ed-seo-kw">Keywords (comma-separated)</label>
                        <input id="ed-seo-kw" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="Leave empty — AI will generate relevant keywords" />
                    </div>
                </div>

                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? "⏳ Publishing..." : isEdit ? "Update Article" : "Publish Article"}
                    </button>
                    <a href="/admin/articles" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
