"use client";

import { useState, useEffect } from "react";

interface Topic {
    title: string;
    category: string;
    description: string;
    selected?: boolean;
    status?: "pending" | "generating" | "done" | "error";
}

export default function AIGenerator() {
    const [tab, setTab] = useState<"topics" | "single" | "batch">("topics");
    const [topics, setTopics] = useState<Topic[]>([]);
    const [topicFocus, setTopicFocus] = useState("");
    const [topicCount, setTopicCount] = useState(5);
    const [loadingTopics, setLoadingTopics] = useState(false);

    // Single gen
    const [singleTitle, setSingleTitle] = useState("");
    const [singleCategory, setSingleCategory] = useState("POLICY BRIEF");
    const [singleDesc, setSingleDesc] = useState("");
    const [generating, setGenerating] = useState(false);

    const [msg, setMsg] = useState("");
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);

    // Detailed progress for active job
    const [progressStep, setProgressStep] = useState("");
    const [progressElapsed, setProgressElapsed] = useState(0);

    // Tick elapsed timer when something is running
    useEffect(() => {
        const running = loadingTopics || generating || batchRunning;
        if (!running) { setProgressElapsed(0); return; }
        setProgressElapsed(0);
        const t = setInterval(() => setProgressElapsed(e => e + 1), 1000);
        return () => clearInterval(t);
    }, [loadingTopics, generating, batchRunning]);

    // Generate Topics
    const genTopics = async () => {
        setLoadingTopics(true);
        setMsg("");
        setProgressStep("Asking DeepSeek for topic ideas...");
        try {
            const res = await fetch("/api/ai/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: topicCount, focus: topicFocus || undefined }),
            });
            const data = await res.json();
            if (res.ok) {
                setTopics(data.topics.map((t: Topic) => ({ ...t, selected: false, status: "pending" as const })));
            } else {
                setMsg(data.error || "Failed to generate topics.");
            }
        } catch (err) {
            setMsg((err as Error).message);
        }
        setLoadingTopics(false);
        setProgressStep("");
    };

    // Generate single article
    const genSingle = async () => {
        if (!singleTitle) { setMsg("Enter a title/topic."); return; }
        setGenerating(true);
        setMsg("");
        try {
            setProgressStep("AI is drafting the article (this takes 20–40s)...");
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: singleTitle, category: singleCategory, description: singleDesc }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProgressStep("Saving article to database...");
            const saveRes = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data.article),
            });
            const saved = await saveRes.json();
            if (saveRes.ok) {
                setMsg(`✓ Article published: "${saved.title}"`);
                setSingleTitle("");
                setSingleDesc("");
            } else {
                throw new Error(saved.error);
            }
        } catch (err) {
            setMsg(`Error: ${(err as Error).message}`);
        }
        setGenerating(false);
        setProgressStep("");
    };

    // Toggle topic selection
    const toggleTopic = (i: number) => {
        setTopics(prev => prev.map((t, j) => j === i ? { ...t, selected: !t.selected } : t));
    };

    // Batch generate selected topics
    const genBatch = async () => {
        const selected = topics.filter(t => t.selected);
        if (selected.length === 0) { setMsg("Select at least one topic."); return; }

        setBatchRunning(true);
        setBatchProgress(0);
        setMsg("");

        let processed = 0;
        for (let i = 0; i < topics.length; i++) {
            if (!topics[i].selected) continue;

            processed++;
            setProgressStep(`Generating ${processed} of ${selected.length}: "${topics[i].title}"`);
            setTopics(prev => prev.map((t, j) => j === i ? { ...t, status: "generating" } : t));

            try {
                const res = await fetch("/api/ai/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: topics[i].title, category: topics[i].category, description: topics[i].description }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const saveRes = await fetch("/api/articles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data.article),
                });
                if (!saveRes.ok) {
                    const err = await saveRes.json();
                    throw new Error(err.error);
                }

                setTopics(prev => prev.map((t, j) => j === i ? { ...t, status: "done" } : t));
            } catch {
                setTopics(prev => prev.map((t, j) => j === i ? { ...t, status: "error" } : t));
            }

            setBatchProgress(prev => prev + 1);
        }

        setBatchRunning(false);
        setProgressStep("");
        const done = topics.filter(t => t.selected && t.status === "done").length;
        setMsg(`Batch complete: ${done} of ${selected.length} articles published.`);
    };

    const isRunning = loadingTopics || generating || batchRunning;
    const batchTotal = topics.filter(t => t.selected).length;
    const batchPct = batchRunning && batchTotal > 0 ? Math.round((batchProgress / batchTotal) * 100) : 0;

    return (
        <div className="ai-gen">
            {/* Tabs */}
            <div className="ai-tabs">
                <button className={`ai-tab${tab === "topics" ? " active" : ""}`} onClick={() => setTab("topics")}>🎯 Generate Topics</button>
                <button className={`ai-tab${tab === "single" ? " active" : ""}`} onClick={() => setTab("single")}>✏️ Single Article</button>
                <button className={`ai-tab${tab === "batch" ? " active" : ""}`} onClick={() => setTab("batch")}>📦 Batch Generate</button>
            </div>

            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            {isRunning && (
                <div style={{ margin: "1rem 0", padding: "1rem 1.25rem", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(139,28,28,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--crimson, #8b1c1c)", borderTopColor: "transparent", borderRadius: "50%", animation: "ai-spin 0.8s linear infinite" }} />
                            <strong style={{ fontSize: "0.9rem" }}>{progressStep || "Working..."}</strong>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                            {batchRunning ? `${batchProgress}/${batchTotal}` : `${progressElapsed}s`}
                        </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
                        {batchRunning ? (
                            <div style={{ width: `${batchPct}%`, height: "100%", background: "var(--crimson, #8b1c1c)", transition: "width 0.3s ease" }} />
                        ) : (
                            <div style={{ width: "30%", height: "100%", background: "var(--crimson, #8b1c1c)", animation: "ai-indeterminate 1.4s ease-in-out infinite" }} />
                        )}
                    </div>
                    <style>{`
                        @keyframes ai-spin { to { transform: rotate(360deg); } }
                        @keyframes ai-indeterminate {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(400%); }
                        }
                    `}</style>
                </div>
            )}

            {/* TOPICS TAB */}
            {tab === "topics" && (
                <div className="ai-panel">
                    <h3 className="ai-panel-title">Topic Generator</h3>
                    <p className="ai-panel-desc">Generate article topics aligned with NADI&apos;s core areas. You can then use these for single or batch article generation.</p>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label>Focus Area (optional)</label>
                            <input value={topicFocus} onChange={e => setTopicFocus(e.target.value)} placeholder="e.g. vaccine governance, health financing..." className="editor-input" />
                        </div>
                        <div className="form-group">
                            <label>Number of Topics</label>
                            <select value={topicCount} onChange={e => setTopicCount(Number(e.target.value))}>
                                <option value={3}>3 topics</option>
                                <option value={5}>5 topics</option>
                                <option value={8}>8 topics</option>
                                <option value={10}>10 topics</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={genTopics} className="btn-primary" disabled={loadingTopics} style={{ marginTop: "1rem" }}>
                        {loadingTopics ? "Generating..." : "Generate Topics"}
                    </button>

                    {topics.length > 0 && (
                        <div className="ai-topics">
                            <div className="ai-topics-header">
                                <span>{topics.length} topics generated</span>
                                <button onClick={() => { setTopics(topics.map(t => ({ ...t, selected: true }))); setTab("batch"); }} className="admin-btn">Select All → Batch</button>
                            </div>
                            {topics.map((t, i) => (
                                <div key={i} className={`ai-topic${t.selected ? " selected" : ""}`} onClick={() => toggleTopic(i)}>
                                    <div className="ai-topic-check">{t.selected ? "✓" : ""}</div>
                                    <div className="ai-topic-content">
                                        <span className="ai-topic-cat">{t.category}</span>
                                        <h4 className="ai-topic-title">{t.title}</h4>
                                        <p className="ai-topic-desc">{t.description}</p>
                                    </div>
                                    <div className="ai-topic-actions">
                                        <button className="admin-btn" onClick={(e) => { e.stopPropagation(); setSingleTitle(t.title); setSingleCategory(t.category); setSingleDesc(t.description); setTab("single"); }}>Generate →</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SINGLE TAB */}
            {tab === "single" && (
                <div className="ai-panel">
                    <h3 className="ai-panel-title">Single Article Generator</h3>
                    <p className="ai-panel-desc">Generate one article. AI will output JSON with magazine-style blocks, SEO meta, and structured content.</p>
                    <div className="form-group">
                        <label>Article Title / Topic *</label>
                        <input value={singleTitle} onChange={e => setSingleTitle(e.target.value)} placeholder="e.g. Health Financing Sustainability in Post-Pandemic Indonesia" className="editor-input" />
                    </div>
                    <div className="editor-grid">
                        <div className="form-group">
                            <label>Category</label>
                            <select value={singleCategory} onChange={e => setSingleCategory(e.target.value)}>
                                <option>POLICY BRIEF</option><option>RESEARCH PAPER</option><option>POLICY ANALYSIS</option>
                                <option>OPINION</option><option>RESEARCH NOTE</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Brief Description (optional)</label>
                            <input value={singleDesc} onChange={e => setSingleDesc(e.target.value)} placeholder="What should the article cover?" className="editor-input" />
                        </div>
                    </div>
                    <button onClick={genSingle} className="btn-primary" disabled={generating} style={{ marginTop: "1rem" }}>
                        {generating ? "⏳ Generating article..." : "Generate & Publish"}
                    </button>
                    {generating && <p className="ai-status">AI is writing your article... This may take 20-40 seconds.</p>}
                </div>
            )}

            {/* BATCH TAB */}
            {tab === "batch" && (
                <div className="ai-panel">
                    <h3 className="ai-panel-title">Batch Generator</h3>
                    <p className="ai-panel-desc">Generate multiple articles sequentially (one by one). Select topics from the Topics tab first, or they&apos;ll appear here.</p>

                    {topics.filter(t => t.selected).length === 0 ? (
                        <div className="ai-empty">
                            <p>No topics selected. Go to <button onClick={() => setTab("topics")} className="ai-link">Generate Topics</button> first, then select the ones you want.</p>
                        </div>
                    ) : (
                        <>
                            <div className="ai-batch-header">
                                <span>{topics.filter(t => t.selected).length} topics selected</span>
                                {batchRunning && <span className="ai-batch-progress">Progress: {batchProgress} / {topics.filter(t => t.selected).length}</span>}
                            </div>
                            <div className="ai-batch-list">
                                {topics.filter(t => t.selected).map((t, i) => (
                                    <div key={i} className={`ai-batch-item ai-batch-item--${t.status}`}>
                                        <span className="ai-batch-status">
                                            {t.status === "done" && "✓"}
                                            {t.status === "generating" && "⏳"}
                                            {t.status === "error" && "✗"}
                                            {t.status === "pending" && "○"}
                                        </span>
                                        <div>
                                            <span className="ai-topic-cat">{t.category}</span>
                                            <h4 className="ai-topic-title">{t.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={genBatch} className="btn-primary" disabled={batchRunning} style={{ marginTop: "1rem" }}>
                                {batchRunning ? `⏳ Generating... (${batchProgress}/${topics.filter(t => t.selected).length})` : "Start Batch Generation"}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
