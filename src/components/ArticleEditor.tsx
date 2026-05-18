"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast, confirmDialog, promptDialog } from "@/components/Toast";
import PolicyProductPicker from "@/components/PolicyProductPicker";
import AuthorshipAck from "@/components/AuthorshipAck";
import AiDisclosureField from "@/components/AiDisclosureField";
import WordCounter from "@/components/WordCounter";
import CommentThread from "@/components/CommentThread";
import ReviewHistory from "@/components/ReviewHistory";
import ApproveButton from "@/components/ApproveButton";
import PublishButton from "@/components/PublishButton";
import { POLICY_PRODUCTS, type PolicyProductType } from "@/data/policy-products";
import { buildScaffoldHTML, isUntouchedScaffold } from "@/lib/template-scaffold";

interface ArticleEditorProps {
    slug?: string;
}

type ArticleStatus = "draft" | "in_review" | "changes_requested" | "approved" | "consent_received" | "published";

type FieldError = "title" | "content" | "type" | "ack" | "ai" | null;

export default function ArticleEditor({ slug }: ArticleEditorProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const role = session?.user?.role || "contributor";
    const canPublish = role === "admin" || role === "reviewer";
    const editorRef = useRef<HTMLDivElement>(null);
    const isEdit = !!slug;
    const toast = useToast();
    const [fieldError, setFieldError] = useState<FieldError>(null);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("POLICY BRIEF");
    // Default author byline is the signed-in user's name — useEffect below
    // hydrates this once the session resolves. Editing an existing article
    // overrides with whatever's stored on the row.
    const [author, setAuthor] = useState("");
    const [readTime, setReadTime] = useState("8 min read");
    const [coverColor, setCoverColor] = useState("crimson");
    const [seoDesc, setSeoDesc] = useState("");
    const [seoKeywords, setSeoKeywords] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [uploadingCover, setUploadingCover] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [articleStatus, setArticleStatus] = useState<ArticleStatus>("draft");
    const [feedbackPending, setFeedbackPending] = useState(false);
    // Phase B fields
    const [policyProductType, setPolicyProductType] = useState<PolicyProductType | "">("");
    const [aiDisclosure, setAiDisclosure] = useState("");
    const [noAi, setNoAi] = useState(false);
    const [containsPrimaryResearch, setContainsPrimaryResearch] = useState(false);
    const [authorshipAck, setAuthorshipAck] = useState<[boolean, boolean, boolean]>([false, false, false]);
    const [editorText, setEditorText] = useState("");
    const [summarySocial, setSummarySocial] = useState("");
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
    const [nowTick, setNowTick] = useState(Date.now());
    // AI Magazine Style toggle. When ON (default), the saved content goes through
    // /api/ai/format which splits it into magazine blocks (pullquote / stat /
    // callout / etc). When OFF, the writer's HTML is saved verbatim as a single
    // 'html' block and the editor layout switches to a wider, Gutenberg-style
    // split (content centre, all metadata in the right sidebar).
    const [aiStyleEnabled, setAiStyleEnabled] = useState(true);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Tick once every 15s so the "Saved as DRAFT — X ago" indicator stays fresh.
    useEffect(() => {
        if (!lastSavedAt) return;
        const id = setInterval(() => setNowTick(Date.now()), 15_000);
        return () => clearInterval(id);
    }, [lastSavedAt]);

    const formatRelative = (ts: number, now: number = nowTick): string => {
        const diffMs = Math.max(0, now - ts);
        const s = Math.floor(diffMs / 1000);
        if (s < 30) return "beberapa detik";
        if (s < 60) return `${s} detik`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m} menit`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h} jam`;
        const d = Math.floor(h / 24);
        return `${d} hari`;
    };

    // Char counter — coloured by state (under, ok, over).
    const Counter = ({ value, max }: { value: number; max: number }) => {
        const colour = value > max ? "#c44" : value > max * 0.9 ? "#9a6a10" : "var(--muted)";
        return <span style={{ fontSize: "0.7rem", color: colour, fontFamily: "var(--font-mono, monospace)" }}>{value}/{max}</span>;
    };

    // Prefill the byline with the signed-in user's name on a fresh article so
    // contributors / partners don't have to retype it. We only set it if the
    // field is still empty — once the user edits the field manually, leave it
    // alone. Editing an existing article will load the stored byline below.
    useEffect(() => {
        if (isEdit) return;
        if (author) return;
        const sessionName = session?.user?.name;
        if (sessionName) setAuthor(sessionName);
    }, [session?.user?.name, isEdit, author]);

    // Load existing article
    useEffect(() => {
        if (!isEdit) return;
        fetch(`/api/articles?slug=${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.title) {
                    setTitle(data.title);
                    setCategory(data.category || "POLICY BRIEF");
                    setAuthor(data.author || session?.user?.name || "");
                    setReadTime(data.readTime || "8 min read");
                    setCoverColor(data.coverColor || "crimson");
                    setCoverImage(data.coverImage || "");
                    setPdfUrl(data.pdfUrl || "");
                    setSeoDesc(data.seo?.description || "");
                    setSeoKeywords(data.seo?.keywords?.join(", ") || "");
                    setArticleStatus(data.status || "published");
                    setFeedbackPending(!!data.feedbackPending);
                    setPolicyProductType(data.policyProductType || "");
                    setAiDisclosure(data.aiDisclosure || "");
                    setNoAi(!data.aiDisclosure);
                    setContainsPrimaryResearch(!!data.containsPrimaryResearch);
                    setSummarySocial(data.summarySocial || "");
                    // Detect manual-mode articles: a single 'html' block means the
                    // writer authored the layout themselves and didn't run AI format.
                    if (Array.isArray(data.blocks) && data.blocks.length === 1 && data.blocks[0]?.type === "html") {
                        setAiStyleEnabled(false);
                    }
                    if (data.blocks && editorRef.current) {
                        editorRef.current.innerHTML = blocksToHTML(data.blocks);
                        setEditorText(editorRef.current.innerText || "");
                    }
                }
            })
            .catch(() => toast.error("Failed to load article."));
    }, [slug, isEdit, toast]);

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
                case "html": return String(b.html || "");
                default: return `<p>${b.text || ""}</p>`;
            }
        }).join("");
    };

    /** Mirror the contentEditable's HTML into a single article block so the
     *  layout the writer chose survives the round-trip. */
    function htmlToBlocks(html: string) {
        return [{ type: "html" as const, html }];
    }

    // When partner picks a product type, seed the editor with section scaffold —
    // but only if the editor is empty or still holds an untouched scaffold from a
    // previous pick. Also auto-set the legacy `category` field.
    const handleProductTypeChange = useCallback((next: PolicyProductType) => {
        setPolicyProductType(next);
        const product = POLICY_PRODUCTS[next];
        if (product?.legacyCategory) setCategory(product.legacyCategory);
        const currentHTML = editorRef.current?.innerHTML || "";
        const currentText = editorRef.current?.innerText?.trim() || "";
        if (!currentText || isUntouchedScaffold(currentHTML)) {
            if (editorRef.current) {
                editorRef.current.innerHTML = buildScaffoldHTML(next);
                setEditorText(editorRef.current.innerText || "");
            }
        }
    }, []);

    // Rich text commands
    const exec = useCallback((cmd: string, value?: string) => {
        document.execCommand(cmd, false, value);
        editorRef.current?.focus();
    }, []);

    const insertLink = async () => {
        const url = await promptDialog({
            title: "Insert link",
            message: "Paste the URL to link the selected text.",
            placeholder: "https://example.com",
        });
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
            setStatus("");
            toast.success("Cover image uploaded.");
        } catch (err) {
            setStatus("");
            toast.error((err as Error).message);
        }
        setUploadingCover(false);
    };

    const handlePdfUpload = async (file: File) => {
        if (!file || file.size === 0) return;
        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file.");
            return;
        }
        setUploadingPdf(true);
        setStatus("⏳ Uploading PDF...");
        try {
            const fd = new FormData();
            fd.append("pdf", file);
            fd.append("fileType", "pdf");
            fd.append("slug", slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "draft");
            const res = await fetch("/api/articles/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPdfUrl(data.url);
            setStatus("");
            toast.success("PDF uploaded.");
        } catch (err) {
            setStatus("");
            toast.error((err as Error).message);
        }
        setUploadingPdf(false);
    };

    const handleSubmit = async (e: FormEvent, intent: "publish" | "submit" | "draft" = canPublish ? "publish" : "submit") => {
        e.preventDefault();
        const content = editorRef.current?.innerText || "";
        setFieldError(null);
        if (!title.trim()) { setFieldError("title"); toast.error("Title is required."); return; }
        if (content.trim().length < 30) { setFieldError("content"); toast.error("Write some content first (at least 30 characters)."); return; }

        // Gate Submit-for-review (and direct Publish) on the Authorship + AI ack.
        // Draft saves can skip — partners can still scribble and save before completing the ack.
        if (intent !== "draft") {
            if (!policyProductType) { setFieldError("type"); toast.error("Please choose a Policy Product Type."); return; }
            if (!authorshipAck.every(Boolean)) { setFieldError("ack"); toast.error("Please acknowledge all three Authorship & Research Integrity rules."); return; }
            if (!noAi && !aiDisclosure.trim()) { setFieldError("ai"); toast.error("Please describe your AI use, or tick \"I did not use any AI tools\"."); return; }
        }

        setSaving(true);
        setStatus(aiStyleEnabled ? "⏳ AI is formatting your article into magazine layout..." : "⏳ Saving your article...");

        try {
            // Step 1: Pick the block-builder. AI mode runs the magazine formatter;
            // manual mode just packages the contentEditable HTML as a single block
            // so the writer's layout is preserved on save.
            let blocks: unknown[];
            if (aiStyleEnabled) {
                const formatRes = await fetch("/api/ai/format", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                });
                const formatData = await formatRes.json();
                if (!formatRes.ok) throw new Error(formatData.error);
                blocks = formatData.blocks;
            } else {
                blocks = htmlToBlocks(editorRef.current?.innerHTML || "");
            }

            // Step 2: Auto-generate SEO if empty (skip SEO AI call too when AI is
            // explicitly off — the writer can fill SEO manually).
            let finalSeoDesc = seoDesc;
            let finalKeywords = seoKeywords.split(",").map((k) => k.trim()).filter(Boolean);
            if (aiStyleEnabled && (!finalSeoDesc || finalKeywords.length === 0)) {
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
            const article: Record<string, unknown> = {
                slug: articleSlug,
                title,
                subtitle: "",
                category,
                author,
                readTime,
                date: new Date().toISOString().split("T")[0],
                coverColor,
                coverImage,
                pdfUrl,
                seo: { description: finalSeoDesc, keywords: finalKeywords },
                blocks,
                policyProductType: policyProductType || undefined,
                aiDisclosure: noAi ? "" : aiDisclosure,
                containsPrimaryResearch,
                summarySocial,
            };
            if (intent === "publish" && canPublish) article.status = "published";
            if (intent === "draft") article.status = "draft";
            if (intent === "submit") article.submit = true;

            const saveRes = await fetch("/api/articles", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(article),
            });
            const saveData = await saveRes.json();
            if (!saveRes.ok) throw new Error(saveData.error);

            const verbMap = { publish: "published", submit: "submitted for review", draft: "saved as draft" } as const;
            setStatus("");
            toast.success(`Article ${verbMap[intent]}.`);
            setArticleStatus(saveData.status || (intent === "publish" ? "published" : intent === "submit" ? "in_review" : "draft"));
            setLastSavedAt(Date.now());
            setNowTick(Date.now());
            if (!isEdit) setTimeout(() => router.push("/admin/articles"), 1000);
        } catch (err) {
            setStatus("");
            toast.error((err as Error).message);
        }
        setSaving(false);
    };

    // Sections that move between the form (AI mode) and the right aside
    // (manual / Gutenberg-style mode). Extracted into variables so they live in
    // exactly one place in the rendered tree no matter which mode is active.
    const policyTypeSection = (
        <div className="editor-section" style={fieldError === "type" ? { border: "1px solid #8B1C1C", borderRadius: 6, padding: "0.75rem", backgroundColor: "#fdf6f6" } : undefined}>
            <PolicyProductPicker
                value={policyProductType}
                onChange={(v) => { handleProductTypeChange(v); if (fieldError === "type") setFieldError(null); }}
                disabled={isEdit && !!policyProductType && articleStatus !== "draft" && articleStatus !== "changes_requested" && !canPublish}
            />
            {policyProductType === "policy_brief" && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.85rem" }}>
                    <input
                        type="checkbox"
                        checked={containsPrimaryResearch}
                        onChange={(e) => setContainsPrimaryResearch(e.target.checked)}
                    />
                    This brief contains primary research (will be flagged for QC verification)
                </label>
            )}
        </div>
    );

    const metaSection = (
        <div className="editor-section">
            <div className="editor-section-title">Article Details</div>
            <div className={`form-group${fieldError === "title" ? " field-error" : ""}`}>
                <label htmlFor="ed-title" className={fieldError === "title" ? "field-error-label" : ""} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span>Title *</span>
                    <Counter value={title.length} max={80} />
                </label>
                <input id="ed-title" value={title} onChange={(e) => { setTitle(e.target.value); if (fieldError === "title") setFieldError(null); }} required placeholder="e.g. Health Financing Sustainability in Post-Pandemic Indonesia" maxLength={120} />
            </div>
            <div className="editor-grid">
                <div className="form-group">
                    <label htmlFor="ed-cat">Category</label>
                    <select id="ed-cat" value={category} onChange={e => setCategory(e.target.value)}>
                        <option>POLICY BRIEF</option><option>RESEARCH PAPER</option><option>POLICY ANALYSIS</option>
                        <option>OPINION</option><option>RESEARCH NOTE</option>
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
    );

    const coverSection = (
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
                    style={{ border: '2px dashed var(--line)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onClick={() => coverInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--crimson)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--line)'; const f = e.dataTransfer.files[0]; if (f) handleCoverUpload(f); }}
                >
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{uploadingCover ? '⏳ Uploading...' : '📷 Click or drag image to upload'}</p>
                </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
        </div>
    );

    const pdfSection = (
        <div className="editor-section">
            <div className="editor-section-title">PDF Document <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></div>
            {pdfUrl ? (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(139,28,28,0.06)', borderRadius: '6px', border: '1px solid rgba(139,28,28,0.15)' }}>
                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>PDF Attached</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{pdfUrl.split('/').pop()}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn-outline" style={{ fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => pdfInputRef.current?.click()} disabled={uploadingPdf}>{uploadingPdf ? '⏳...' : 'Change'}</button>
                        <button type="button" className="btn-outline" style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#c44' }} onClick={() => setPdfUrl('')}>Remove</button>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: '0.72rem', padding: '4px 10px', textDecoration: 'none' }}>Preview ↗</a>
                    </div>
                </div>
            ) : (
                <div
                    style={{ border: '2px dashed var(--line)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--crimson)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--line)'; const f = e.dataTransfer.files[0]; if (f) handlePdfUpload(f); }}
                >
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{uploadingPdf ? '⏳ Uploading PDF...' : '📄 Click or drag PDF (max 20MB)'}</p>
                </div>
            )}
            <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
        </div>
    );

    const ackSection = (
        <div className="editor-section" style={fieldError === "ack" ? { border: "1px solid #8B1C1C", borderRadius: 6, padding: "0.75rem", backgroundColor: "#fdf6f6" } : undefined}>
            <AuthorshipAck values={authorshipAck} onChange={(v) => { setAuthorshipAck(v); if (fieldError === "ack") setFieldError(null); }} />
        </div>
    );

    const aiDisclosureSection = (
        <div className="editor-section" style={fieldError === "ai" ? { border: "1px solid #8B1C1C", borderRadius: 6, padding: "0.75rem", backgroundColor: "#fdf6f6" } : undefined}>
            <AiDisclosureField
                value={aiDisclosure}
                onChange={(v) => { setAiDisclosure(v); if (fieldError === "ai") setFieldError(null); }}
                noAi={noAi}
                onNoAiChange={(v) => { setNoAi(v); if (fieldError === "ai") setFieldError(null); }}
            />
        </div>
    );

    const seoSection = (
        <div className="editor-section">
            <div className="editor-section-title">SEO Settings <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{aiStyleEnabled ? "— leave description empty to auto-generate with AI" : "— fill in manually"}</span></div>
            <div className="form-group">
                <label htmlFor="ed-seo-desc" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span>Description</span>
                    <Counter value={seoDesc.length} max={200} />
                </label>
                <input id="ed-seo-desc" value={seoDesc} onChange={e => setSeoDesc(e.target.value)} maxLength={250} placeholder={aiStyleEnabled ? "Leave empty — AI will generate it." : "Search-engine meta description."} />
            </div>
            <div className="form-group">
                <label htmlFor="ed-summary-social" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span>Summary Social</span>
                    <Counter value={summarySocial.length} max={200} />
                </label>
                <input id="ed-summary-social" value={summarySocial} onChange={e => setSummarySocial(e.target.value)} maxLength={250} placeholder="Used as the social-share / Open Graph preview text." />
                <span className="editor-hint">Shown when the article is shared on Twitter / LinkedIn / WhatsApp.</span>
            </div>
            <div className="form-group">
                <label htmlFor="ed-seo-kw">Keywords (comma-separated)</label>
                <input id="ed-seo-kw" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder={aiStyleEnabled ? "Leave empty — AI will generate relevant keywords" : "comma-separated keywords"} />
            </div>
        </div>
    );

    return (
        <div className="admin-body" style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                    <h1 className="admin-page-title" style={{ margin: 0 }}>{isEdit ? "Edit Article" : "Write New Article"}</h1>
                    <p className="admin-page-desc" style={{ margin: "0.25rem 0 0" }}>
                        {aiStyleEnabled
                            ? "AI will format your content into a magazine-style layout on save."
                            : "Manual mode — the layout you author is saved verbatim."}
                    </p>
                </div>
                {/* AI Magazine Style toggle. Switching mid-edit doesn't move existing
                    content, but the next save will use the active mode's block format. */}
                <label
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.55rem 0.85rem",
                        border: "1px solid var(--line, #ddd)",
                        borderRadius: 24,
                        background: aiStyleEnabled ? "rgba(139,28,28,0.08)" : "rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        userSelect: "none",
                    }}
                >
                    <span aria-hidden style={{ fontSize: "1rem" }}>{aiStyleEnabled ? "✦" : "✎"}</span>
                    <span>AI Magazine Style</span>
                    <span
                        aria-hidden
                        style={{
                            position: "relative",
                            width: 36,
                            height: 20,
                            borderRadius: 10,
                            background: aiStyleEnabled ? "#8B1C1C" : "#bbb",
                            transition: "background 0.15s",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                top: 2,
                                left: aiStyleEnabled ? 18 : 2,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#fff",
                                transition: "left 0.15s",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                            }}
                        />
                    </span>
                    <input
                        type="checkbox"
                        checked={aiStyleEnabled}
                        onChange={(e) => setAiStyleEnabled(e.target.checked)}
                        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                </label>
            </div>

            <div
                className={`editor-grid-wrap editor-mode-${aiStyleEnabled ? "ai" : "manual"}`}
                style={{
                    display: "grid",
                    gridTemplateColumns: aiStyleEnabled ? "minmax(0, 1fr) 280px" : "minmax(0, 1fr) 340px",
                    gap: "1.5rem",
                    alignItems: "start",
                }}
            >
            <form onSubmit={(e) => handleSubmit(e)} className="editor" style={{ minWidth: 0 }}>
                {(feedbackPending || articleStatus === "changes_requested") && (
                    <div style={{
                        background: "rgba(196,68,68,0.10)",
                        border: "1px solid rgba(196,68,68,0.30)",
                        borderRadius: 4,
                        padding: "12px 16px",
                        marginBottom: "1rem",
                        fontSize: "0.88rem",
                        color: "#7a1a1a",
                    }}>
                        ↻ <strong>Changes requested.</strong> A reviewer has sent this article back with notes — read the comment thread below, revise, and click <em>Submit for Review</em> to re-submit.
                    </div>
                )}
                {isEdit && articleStatus === "approved" && !canPublish && (
                    <div style={{
                        background: "rgba(140,90,200,0.10)",
                        border: "1px solid rgba(140,90,200,0.30)",
                        borderRadius: 4,
                        padding: "12px 16px",
                        marginBottom: "1rem",
                        fontSize: "0.88rem",
                        color: "#5a2f8a",
                    }}>
                        ✓ <strong>Approved!</strong> Please check your email for the consent-to-publish form link. The article cannot be published until you submit it.
                    </div>
                )}
                {isEdit && articleStatus === "published" && slug && (
                    <div style={{
                        background: "rgba(40,140,80,0.10)",
                        border: "1px solid rgba(40,140,80,0.30)",
                        borderRadius: 4,
                        padding: "12px 16px",
                        marginBottom: "1rem",
                        fontSize: "0.88rem",
                        color: "#1a5a30",
                    }}>
                        🌐 <strong>Live!</strong> <a href={`/publications/${slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5a30", textDecoration: "underline", fontWeight: 600 }}>View on public site →</a>
                    </div>
                )}

                {aiStyleEnabled && policyTypeSection}
                {aiStyleEnabled && metaSection}
                {aiStyleEnabled && coverSection}
                {aiStyleEnabled && pdfSection}

                {/* Manual mode keeps the title up at the top of the content area
                    so the writer always has a visible heading slot. */}
                {!aiStyleEnabled && (
                    <div className={`editor-section${fieldError === "title" ? " " : ""}`} style={fieldError === "title" ? { border: "1px solid #8B1C1C", borderRadius: 6, padding: "0.75rem", backgroundColor: "#fdf6f6" } : undefined}>
                        <input
                            id="ed-title"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); if (fieldError === "title") setFieldError(null); }}
                            required
                            placeholder="Article title…"
                            maxLength={120}
                            style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "1.85rem",
                                fontWeight: 700,
                                fontFamily: "var(--font-serif, Georgia, 'Times New Roman', serif)",
                                lineHeight: 1.2,
                                padding: "0.4rem 0",
                            }}
                        />
                    </div>
                )}

                {/* Rich Text Editor */}
                <div className="editor-section">
                    <div className="editor-section-title">Content</div>
                    <div className="rte-toolbar">
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("bold")} title="Bold" aria-label="Bold"><b>B</b></button>
                            <button type="button" className="rte-btn" onClick={() => exec("italic")} title="Italic" aria-label="Italic"><i>I</i></button>
                            <button type="button" className="rte-btn" onClick={() => exec("underline")} title="Underline" aria-label="Underline"><u>U</u></button>
                            <button type="button" className="rte-btn" onClick={() => exec("strikeThrough")} title="Strikethrough" aria-label="Strikethrough"><s>S</s></button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "H2")} title="Heading 2" aria-label="Heading 2">H2</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "H3")} title="Heading 3" aria-label="Heading 3">H3</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "P")} title="Paragraph" aria-label="Paragraph">¶</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("insertUnorderedList")} title="Bullet List" aria-label="Bullet List">•</button>
                            <button type="button" className="rte-btn" onClick={() => exec("insertOrderedList")} title="Numbered List" aria-label="Numbered List">1.</button>
                            <button type="button" className="rte-btn" onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="Quote" aria-label="Quote">&ldquo;</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={insertLink} title="Insert Link" aria-label="Insert Link">🔗</button>
                            <button type="button" className="rte-btn" onClick={() => exec("insertHorizontalRule")} title="Divider" aria-label="Divider">—</button>
                            <button type="button" className="rte-btn" onClick={() => exec("removeFormat")} title="Clear Formatting" aria-label="Clear Formatting">✕</button>
                        </div>
                        <div className="rte-toolbar-group">
                            <button type="button" className="rte-btn" onClick={() => exec("justifyLeft")} title="Align Left" aria-label="Align Left">⫷</button>
                            <button type="button" className="rte-btn" onClick={() => exec("justifyCenter")} title="Align Center" aria-label="Align Center">⫿</button>
                            <button type="button" className="rte-btn" onClick={() => exec("justifyRight")} title="Align Right" aria-label="Align Right">⫸</button>
                        </div>
                    </div>
                    <div
                        ref={editorRef}
                        className="rte-content"
                        contentEditable
                        data-placeholder="Start writing your article here...&#10;&#10;Use the toolbar above for formatting:&#10;• Bold, Italic, Underline for emphasis&#10;• H2, H3 for section headings&#10;• Bullet / numbered lists&#10;• Blockquotes for citations&#10;• Links, dividers, and more&#10;&#10;AI will convert your formatted text into a beautiful magazine-style layout when you publish."
                        suppressContentEditableWarning
                        onInput={() => { setEditorText(editorRef.current?.innerText || ""); if (fieldError === "content") setFieldError(null); }}
                        style={fieldError === "content" ? { borderColor: "#8B1C1C", boxShadow: "0 0 0 3px rgba(139,28,28,0.12)", backgroundColor: "#fdf6f6" } : undefined}
                    />
                    {policyProductType && (
                        <div style={{ marginTop: "0.5rem" }}>
                            <WordCounter
                                text={editorText}
                                min={POLICY_PRODUCTS[policyProductType].wordCount.min}
                                max={POLICY_PRODUCTS[policyProductType].wordCount.max}
                            />
                        </div>
                    )}
                    <p className="editor-hint">
                        {aiStyleEnabled
                            ? "✨ AI will auto-format into magazine blocks (pullquotes, stats, callouts, columns, etc.) on publish."
                            : "✎ Manual mode — your formatting is saved verbatim. Use the toolbar above for headings, lists, links, and quotes."}
                    </p>
                </div>

                {aiStyleEnabled && ackSection}
                {aiStyleEnabled && aiDisclosureSection}
                {aiStyleEnabled && seoSection}

                {status && (
                    <div
                        style={{
                            background: "#F4F6FA",
                            border: "1px solid #d3dae8",
                            borderLeft: "3px solid #1d4a8a",
                            padding: "0.6rem 0.9rem",
                            marginBottom: "0.75rem",
                            fontSize: "0.82rem",
                            color: "#1f2a44",
                            borderRadius: 4,
                        }}
                    >
                        {status}
                    </div>
                )}
                {isEdit && (
                    <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                        Current status:{" "}
                        <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 12,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            background:
                                articleStatus === "published" ? "rgba(40,140,80,0.12)" :
                                    articleStatus === "consent_received" ? "rgba(30,90,170,0.12)" :
                                        articleStatus === "approved" ? "rgba(140,90,200,0.15)" :
                                            articleStatus === "changes_requested" ? "rgba(196,68,68,0.12)" :
                                                articleStatus === "in_review" ? "rgba(220,150,40,0.15)" :
                                                    "rgba(150,150,150,0.15)",
                            color:
                                articleStatus === "published" ? "#1a7a3e" :
                                    articleStatus === "consent_received" ? "#1d4a8a" :
                                        articleStatus === "approved" ? "#6a3a9a" :
                                            articleStatus === "changes_requested" ? "#a83838" :
                                                articleStatus === "in_review" ? "#9a6a10" :
                                                    "#666",
                        }}>
                            {articleStatus.replace(/_/g, " ")}
                        </span>
                    </div>
                )}
                {isEdit && slug && canPublish && (articleStatus === "in_review" || articleStatus === "consent_received") && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <ApproveButton
                            slug={slug}
                            currentStatus={articleStatus}
                            onApproved={() => setArticleStatus("approved")}
                        />
                        <PublishButton
                            slug={slug}
                            currentStatus={articleStatus}
                            onPublished={() => setArticleStatus("published")}
                        />
                    </div>
                )}
                {isEdit && slug && canPublish && articleStatus === "approved" && (
                    <div style={{ marginBottom: "1rem" }}>
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={async () => {
                                const ok = await confirmDialog({
                                    title: "Re-send consent link?",
                                    message: "A fresh 30-day link is emailed to the author.",
                                    confirmText: "Re-send",
                                });
                                if (!ok) return;
                                try {
                                    const res = await fetch(`/api/articles/${slug}/resend-consent`, { method: "POST" });
                                    const d = await res.json();
                                    if (!res.ok) throw new Error(d.error);
                                    toast.success(`Consent link re-sent to ${d.sentTo}`);
                                } catch (err) {
                                    toast.error((err as Error).message);
                                }
                            }}
                            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                        >
                            ✉ Resend consent link
                        </button>
                        <span style={{ marginLeft: "0.75rem", color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic" }}>
                            Article is approved and waiting for the author&apos;s consent form.
                        </span>
                    </div>
                )}
                <div className="editor-save editor-save--inline">
                    <a href="/admin/articles" className="btn-outline">Cancel</a>
                </div>
            </form>

            {/* Sticky side panel. In AI mode it just holds the counters + save
                buttons; in manual (Gutenberg) mode all metadata sections live
                here so the centre column stays focused on writing. The aside
                gets its own scroll once content grows past the viewport. */}
            <aside className="editor-side" style={{
                position: "sticky",
                top: "1rem",
                alignSelf: "start",
                padding: "1.25rem",
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: !aiStyleEnabled ? "calc(100vh - 32px)" : undefined,
                overflowY: !aiStyleEnabled ? "auto" : undefined,
            }}>
                {!aiStyleEnabled && (
                    <>
                        {policyTypeSection}
                        {metaSection}
                        {coverSection}
                        {pdfSection}
                        {ackSection}
                        {aiDisclosureSection}
                        {seoSection}
                    </>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", fontWeight: 600 }}>Status</span>
                    {lastSavedAt ? (
                        <span style={{ fontSize: "0.85rem" }}>
                            Saved as <strong style={{ color: "var(--crimson)" }}>{articleStatus.replace(/_/g, " ").toUpperCase()}</strong>
                            <br />
                            <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{formatRelative(lastSavedAt)} yang lalu</span>
                        </span>
                    ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                            {isEdit ? articleStatus.replace(/_/g, " ").toUpperCase() : "Unsaved draft"}
                        </span>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem", color: "var(--muted)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Title</span><Counter value={title.length} max={80} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Description</span><Counter value={seoDesc.length} max={200} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Summary social</span><Counter value={summarySocial.length} max={200} />
                    </div>
                    {policyProductType && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Words</span>
                            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.7rem" }}>
                                {editorText.trim().split(/\s+/).filter(Boolean).length}
                                {" / "}
                                {POLICY_PRODUCTS[policyProductType].wordCount.min}
                                {POLICY_PRODUCTS[policyProductType].wordCount.max ? `–${POLICY_PRODUCTS[policyProductType].wordCount.max}` : "+"}
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--line)" }}>
                    {canPublish ? (
                        <button type="button" className="btn-primary" disabled={saving} onClick={(e) => handleSubmit(e, "publish")} style={{ width: "100%" }}>
                            {saving ? "⏳ Saving..." : isEdit ? "Update & Publish" : "Publish Article"}
                        </button>
                    ) : (() => {
                        // Submit makes sense only from draft / changes_requested / in_review
                        // (re-submit). Once it's approved or further, the partner's job is
                        // to sign the consent form (sent by email) — not to "submit" again.
                        // Showing a disabled, labelled button avoids the confusion the user
                        // hit where clicking Submit on a consent_received article left the
                        // status unchanged.
                        const stage = articleStatus;
                        const submittable = !isEdit || stage === "draft" || stage === "changes_requested" || stage === "in_review";
                        let label = isEdit && stage === "changes_requested" ? "Re-submit for Review" : "Submit for Review";
                        if (!submittable) {
                            if (stage === "approved") label = "Waiting for your consent form";
                            else if (stage === "consent_received") label = "Waiting for admin to publish";
                            else if (stage === "published") label = "Already published";
                        }
                        return (
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={saving || !submittable}
                                onClick={(e) => handleSubmit(e, "submit")}
                                style={{ width: "100%", opacity: submittable ? 1 : 0.55, cursor: submittable ? "pointer" : "not-allowed" }}
                                title={submittable ? undefined : "This action isn't available at the current stage."}
                            >
                                {saving ? "⏳ Saving..." : label}
                            </button>
                        );
                    })()}
                    <button type="button" className="btn-outline" disabled={saving} onClick={(e) => handleSubmit(e, "draft")} style={{ width: "100%" }}>
                        Save as Draft
                    </button>
                </div>
            </aside>
            </div>

            {isEdit && slug && (
                <div className="editor-section" style={{ marginTop: "2rem" }}>
                    <CommentThread
                        slug={slug}
                        onPosted={() => {
                            // When the partner replies, the server flips feedback_pending=false on next save;
                            // for the admin posting a comment, the server flips it to true. We optimistically
                            // refresh on next page load — for now just clear the local flag if partner posts.
                            if (!canPublish) setFeedbackPending(false);
                        }}
                    />
                </div>
            )}

            {isEdit && slug && (
                <div className="editor-section" style={{ marginTop: "1rem" }}>
                    <ReviewHistory slug={slug} />
                </div>
            )}
        </div>
    );
}
