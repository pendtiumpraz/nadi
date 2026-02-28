"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Article, ContentBlock } from "@/data/articles/types";

const EMPTY_ARTICLE: Article = {
    slug: "", title: "", subtitle: "", category: "ARTICLE", date: new Date().toISOString().split("T")[0],
    readTime: "5 min read", author: "NADI Research Team", coverColor: "charcoal",
    seo: { description: "", keywords: [] }, blocks: [],
};

const BLOCK_TYPES = [
    { type: "lead", label: "Lead Paragraph" },
    { type: "text", label: "Body Text" },
    { type: "heading", label: "Section Heading" },
    { type: "quote", label: "Quote" },
    { type: "pullquote", label: "Pull Quote" },
    { type: "two-column", label: "Two Columns" },
    { type: "asymmetric", label: "Asymmetric Columns" },
    { type: "highlight", label: "Highlight Box" },
    { type: "callout", label: "Callout" },
    { type: "list", label: "List" },
    { type: "stat", label: "Statistic" },
    { type: "divider", label: "Divider" },
];

function createEmptyBlock(type: string): ContentBlock {
    switch (type) {
        case "lead":
        case "text":
        case "heading":
        case "pullquote":
        case "highlight":
            return { type: type as "lead", text: "" };
        case "quote":
            return { type: "quote", text: "", attribution: "" };
        case "two-column":
            return { type: "two-column", left: "", right: "" };
        case "asymmetric":
            return { type: "asymmetric", left: "", right: "", offsetRight: true };
        case "callout":
            return { type: "callout", label: "KEY FINDING", text: "" };
        case "list":
            return { type: "list", items: [""] };
        case "stat":
            return { type: "stat", value: "", label: "" };
        case "divider":
            return { type: "divider" };
        default:
            return { type: "text", text: "" };
    }
}

interface Props {
    slug?: string;
}

export default function ArticleEditor({ slug }: Props) {
    const router = useRouter();
    const [article, setArticle] = useState<Article>(EMPTY_ARTICLE);
    const [loading, setLoading] = useState(!!slug);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");

    useEffect(() => {
        if (slug) {
            fetch("/api/articles").then(r => r.json()).then((articles: Article[]) => {
                const found = articles.find(a => a.slug === slug);
                if (found) {
                    setArticle(found);
                    setSeoKeywords(found.seo.keywords.join(", "));
                }
                setLoading(false);
            });
        }
    }, [slug]);

    const updateField = (field: string, value: string) => {
        setArticle(prev => ({ ...prev, [field]: value }));
    };

    const updateSeo = (field: string, value: string) => {
        setArticle(prev => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
    };

    const addBlock = (type: string) => {
        setArticle(prev => ({ ...prev, blocks: [...prev.blocks, createEmptyBlock(type)] }));
    };

    const removeBlock = (index: number) => {
        setArticle(prev => ({ ...prev, blocks: prev.blocks.filter((_, i) => i !== index) }));
    };

    const moveBlock = (index: number, dir: -1 | 1) => {
        const newIdx = index + dir;
        if (newIdx < 0 || newIdx >= article.blocks.length) return;
        const blocks = [...article.blocks];
        [blocks[index], blocks[newIdx]] = [blocks[newIdx], blocks[index]];
        setArticle(prev => ({ ...prev, blocks }));
    };

    const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
        setArticle(prev => ({
            ...prev,
            blocks: prev.blocks.map((b, i) => i === index ? { ...b, ...updates } as ContentBlock : b),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg("");
        const data = { ...article, seo: { ...article.seo, keywords: seoKeywords.split(",").map(k => k.trim()).filter(Boolean) } };
        const method = slug ? "PUT" : "POST";
        const res = await fetch("/api/articles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const result = await res.json();
        setSaving(false);
        if (res.ok) {
            setMsg("Saved successfully!");
            if (!slug) router.push(`/admin/articles/${result.slug}`);
        } else {
            setMsg(result.error || "Failed to save.");
        }
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading...</p>;

    return (
        <div className="editor">
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            {/* Meta section */}
            <div className="editor-section">
                <h3 className="editor-section-title">Article Details</h3>
                <div className="editor-grid">
                    <div className="form-group">
                        <label>Title *</label>
                        <input value={article.title} onChange={e => updateField("title", e.target.value)} placeholder="Article title" />
                    </div>
                    <div className="form-group">
                        <label>Subtitle</label>
                        <input value={article.subtitle} onChange={e => updateField("subtitle", e.target.value)} placeholder="Short subtitle" />
                    </div>
                </div>
                <div className="editor-grid editor-grid--3">
                    <div className="form-group">
                        <label>Category</label>
                        <select value={article.category} onChange={e => updateField("category", e.target.value)}>
                            <option>ARTICLE</option><option>POLICY BRIEF</option><option>RESEARCH PAPER</option>
                            <option>STRATEGIC ANALYSIS</option><option>WORKING PAPER</option><option>RESEARCH NOTE</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={article.date} onChange={e => updateField("date", e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Read Time</label>
                        <input value={article.readTime} onChange={e => updateField("readTime", e.target.value)} placeholder="5 min read" />
                    </div>
                </div>
                <div className="editor-grid editor-grid--3">
                    <div className="form-group">
                        <label>Author</label>
                        <input value={article.author} onChange={e => updateField("author", e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Cover Color</label>
                        <select value={article.coverColor} onChange={e => updateField("coverColor", e.target.value)}>
                            <option value="crimson">Crimson</option><option value="charcoal">Charcoal</option><option value="dark">Dark</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Slug</label>
                        <input value={article.slug} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated" disabled={!!slug} />
                    </div>
                </div>
            </div>

            {/* SEO */}
            <div className="editor-section">
                <h3 className="editor-section-title">SEO</h3>
                <div className="form-group">
                    <label>Meta Description</label>
                    <textarea value={article.seo.description} onChange={e => updateSeo("description", e.target.value)} rows={2} placeholder="SEO description (160 chars recommended)" />
                </div>
                <div className="form-group">
                    <label>Keywords (comma-separated)</label>
                    <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="health, policy, governance" />
                </div>
            </div>

            {/* Content Blocks */}
            <div className="editor-section">
                <h3 className="editor-section-title">Content Blocks</h3>
                {article.blocks.length === 0 && (
                    <p className="editor-empty">No content blocks yet. Add one below to start writing.</p>
                )}
                {article.blocks.map((block, i) => (
                    <div key={i} className="editor-block">
                        <div className="editor-block-header">
                            <span className="editor-block-type">{block.type}</span>
                            <div className="editor-block-actions">
                                <button onClick={() => moveBlock(i, -1)} disabled={i === 0} title="Move up">↑</button>
                                <button onClick={() => moveBlock(i, 1)} disabled={i === article.blocks.length - 1} title="Move down">↓</button>
                                <button onClick={() => removeBlock(i)} className="editor-block-delete" title="Remove">×</button>
                            </div>
                        </div>
                        <div className="editor-block-body">
                            {renderBlockEditor(block, i, updateBlock)}
                        </div>
                    </div>
                ))}
                <div className="editor-add-block">
                    <span className="editor-add-label">Add Block:</span>
                    <div className="editor-add-options">
                        {BLOCK_TYPES.map(bt => (
                            <button key={bt.type} onClick={() => addBlock(bt.type)} className="editor-add-btn">{bt.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="editor-save">
                <button onClick={handleSave} className="btn-primary" disabled={saving}>
                    {saving ? "Saving..." : slug ? "Update Article" : "Publish Article"}
                </button>
                <a href="/admin/articles" className="btn-outline">Cancel</a>
            </div>
        </div>
    );
}

function renderBlockEditor(
    block: ContentBlock,
    index: number,
    update: (i: number, u: Partial<ContentBlock>) => void
) {
    switch (block.type) {
        case "lead":
        case "text":
        case "highlight":
            return <textarea value={block.text} onChange={e => update(index, { text: e.target.value })} rows={3} placeholder={`Enter ${block.type} text...`} className="editor-textarea" />;
        case "heading":
        case "pullquote":
            return <input value={block.text} onChange={e => update(index, { text: e.target.value })} placeholder={block.type === "heading" ? "Section heading" : "Pull quote text"} className="editor-input" />;
        case "quote":
            return (
                <>
                    <textarea value={block.text} onChange={e => update(index, { text: e.target.value })} rows={2} placeholder="Quote text..." className="editor-textarea" />
                    <input value={block.attribution || ""} onChange={e => update(index, { attribution: e.target.value })} placeholder="Attribution (e.g. NADI Framework)" className="editor-input" style={{ marginTop: 8 }} />
                </>
            );
        case "two-column":
            return (
                <div className="editor-cols">
                    <textarea value={block.left} onChange={e => update(index, { left: e.target.value })} rows={3} placeholder="Left column..." className="editor-textarea" />
                    <textarea value={block.right} onChange={e => update(index, { right: e.target.value })} rows={3} placeholder="Right column..." className="editor-textarea" />
                </div>
            );
        case "asymmetric":
            return (
                <>
                    <div className="editor-cols">
                        <textarea value={block.left} onChange={e => update(index, { left: e.target.value })} rows={3} placeholder="Left column..." className="editor-textarea" />
                        <textarea value={block.right} onChange={e => update(index, { right: e.target.value })} rows={3} placeholder="Right column..." className="editor-textarea" />
                    </div>
                    <label className="editor-checkbox">
                        <input type="checkbox" checked={block.offsetRight} onChange={e => update(index, { offsetRight: e.target.checked })} />
                        Offset right column down
                    </label>
                </>
            );
        case "callout":
            return (
                <>
                    <input value={block.label} onChange={e => update(index, { label: e.target.value })} placeholder="Label (e.g. KEY FINDING)" className="editor-input" />
                    <textarea value={block.text} onChange={e => update(index, { text: e.target.value })} rows={2} placeholder="Callout text..." className="editor-textarea" style={{ marginTop: 8 }} />
                </>
            );
        case "list":
            return (
                <div className="editor-list-items">
                    {block.items.map((item, j) => (
                        <div key={j} className="editor-list-row">
                            <input value={item} onChange={e => {
                                const items = [...block.items]; items[j] = e.target.value;
                                update(index, { items });
                            }} placeholder={`Item ${j + 1}`} className="editor-input" />
                            <button onClick={() => {
                                const items = block.items.filter((_, k) => k !== j);
                                update(index, { items: items.length ? items : [""] });
                            }} className="editor-list-remove">×</button>
                        </div>
                    ))}
                    <button onClick={() => update(index, { items: [...block.items, ""] })} className="editor-add-btn">+ Add Item</button>
                </div>
            );
        case "stat":
            return (
                <div className="editor-cols">
                    <input value={block.value} onChange={e => update(index, { value: e.target.value })} placeholder="Value (e.g. 63%)" className="editor-input" />
                    <input value={block.label} onChange={e => update(index, { label: e.target.value })} placeholder="Label text" className="editor-input" />
                </div>
            );
        case "divider":
            return <p className="editor-divider-hint">— Horizontal divider —</p>;
        default:
            return null;
    }
}
