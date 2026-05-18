"use client";

import * as React from "react";
import { useToast, confirmDialog } from "@/components/Toast";

interface Section {
    heading: string;
    placeholder: string;
}

interface PolicyType {
    key: string;
    label: string;
    shortDescription: string;
    wordCount: { min: number; max: number | null };
    pageLength: string;
    tone: string;
    primaryResearchNote: string;
    sections: Section[];
    legacyCategory: string;
    displayOrder: number;
    isArchived: boolean;
}

const EMPTY: PolicyType = {
    key: "",
    label: "",
    shortDescription: "",
    wordCount: { min: 0, max: null },
    pageLength: "",
    tone: "",
    primaryResearchNote: "",
    sections: [{ heading: "", placeholder: "" }],
    legacyCategory: "",
    displayOrder: 999,
    isArchived: false,
};

export default function PolicyTypesClient(): React.JSX.Element {
    const [items, setItems] = React.useState<PolicyType[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [editing, setEditing] = React.useState<PolicyType | null>(null);
    const [isNew, setIsNew] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const toast = useToast();

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/policy-products");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load");
            setItems(data.items || []);
        } catch (err) {
            toast.error((err as Error).message);
        }
        setLoading(false);
    }, [toast]);

    React.useEffect(() => { load(); }, [load]);

    const startNew = () => { setEditing({ ...EMPTY }); setIsNew(true); };
    const startEdit = (item: PolicyType) => { setEditing({ ...item }); setIsNew(false); };
    const cancel = () => { setEditing(null); setIsNew(false); };

    const save = async () => {
        if (!editing) return;
        if (!editing.label.trim()) { toast.error("Label is required."); return; }
        setSaving(true);
        try {
            const url = isNew ? "/api/admin/policy-products" : `/api/admin/policy-products/${editing.key}`;
            const method = isNew ? "POST" : "PUT";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editing),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            toast.success(isNew ? "Type created." : "Type updated.");
            setEditing(null);
            setIsNew(false);
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        }
        setSaving(false);
    };

    const archive = async (item: PolicyType) => {
        const ok = await confirmDialog({
            title: item.isArchived ? "Unarchive type?" : "Archive type?",
            message: item.isArchived
                ? "Existing articles using this type continue to display normally; new articles will see it back in the picker."
                : "Existing articles keep their type label; new article submissions won't see this type in the picker.",
            confirmText: item.isArchived ? "Unarchive" : "Archive",
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/admin/policy-products/${item.key}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: !item.isArchived }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            toast.success(item.isArchived ? "Unarchived." : "Archived.");
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    const destroy = async (item: PolicyType) => {
        const ok = await confirmDialog({
            title: "Delete type permanently?",
            message: `"${item.label}" will be removed. If any article uses this type, the delete will be refused — archive instead.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/admin/policy-products/${item.key}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Failed");
            toast.success("Deleted.");
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    const setField = <K extends keyof PolicyType>(k: K, v: PolicyType[K]) => {
        if (!editing) return;
        setEditing({ ...editing, [k]: v });
    };

    const updateSection = (idx: number, patch: Partial<Section>) => {
        if (!editing) return;
        const next = editing.sections.map((s, i) => i === idx ? { ...s, ...patch } : s);
        setEditing({ ...editing, sections: next });
    };
    const addSection = () => {
        if (!editing) return;
        setEditing({ ...editing, sections: [...editing.sections, { heading: "", placeholder: "" }] });
    };
    const removeSection = (idx: number) => {
        if (!editing) return;
        setEditing({ ...editing, sections: editing.sections.filter((_, i) => i !== idx) });
    };

    if (editing) {
        return (
            <div className="admin-body">
                <div className="admin-content-header">
                    <div>
                        <h1 className="admin-page-title">{isNew ? "New Policy Product Type" : `Edit · ${editing.label}`}</h1>
                        <p className="admin-page-desc">All fields propagate to the article editor's type picker and the public /publications filter.</p>
                    </div>
                    <button className="btn-outline" onClick={cancel}>← Back to list</button>
                </div>

                <form className="editor" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <div className="editor-section">
                        <div className="editor-section-title">Identity</div>
                        <div className="editor-grid">
                            <div className="form-group">
                                <label htmlFor="pt-label">Label *</label>
                                <input id="pt-label" required value={editing.label} onChange={(e) => setField("label", e.target.value)} placeholder="e.g. Policy Brief" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pt-key">Slug (key)</label>
                                <input
                                    id="pt-key"
                                    value={editing.key}
                                    onChange={(e) => setField("key", e.target.value)}
                                    placeholder="auto-derived from label"
                                    disabled={!isNew}
                                    style={!isNew ? { background: "#f5f5f5", color: "#888" } : undefined}
                                />
                                <span className="editor-hint">{isNew ? "Leave empty to auto-generate from label. Cannot be changed later." : "Locked once created so existing articles keep their type reference."}</span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="pt-desc">Short description</label>
                            <textarea
                                id="pt-desc"
                                rows={2}
                                value={editing.shortDescription}
                                onChange={(e) => setField("shortDescription", e.target.value)}
                                placeholder="Shown beneath the picker card."
                                style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: 4, fontFamily: "inherit", fontSize: "0.9rem" }}
                            />
                        </div>
                    </div>

                    <div className="editor-section">
                        <div className="editor-section-title">Length Guidance</div>
                        <div className="editor-grid">
                            <div className="form-group">
                                <label htmlFor="pt-min">Min words</label>
                                <input id="pt-min" type="number" min={0} value={editing.wordCount.min} onChange={(e) => setField("wordCount", { ...editing.wordCount, min: Number(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="pt-max">Max words (blank = no cap)</label>
                                <input
                                    id="pt-max"
                                    type="number"
                                    min={0}
                                    value={editing.wordCount.max ?? ""}
                                    onChange={(e) => setField("wordCount", { ...editing.wordCount, max: e.target.value === "" ? null : Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="pt-page">Page length text</label>
                            <input id="pt-page" value={editing.pageLength} onChange={(e) => setField("pageLength", e.target.value)} placeholder="e.g. 2–4 pages" />
                        </div>
                    </div>

                    <div className="editor-section">
                        <div className="editor-section-title">Editorial Notes</div>
                        <div className="form-group">
                            <label htmlFor="pt-tone">Tone</label>
                            <input id="pt-tone" value={editing.tone} onChange={(e) => setField("tone", e.target.value)} placeholder="e.g. Neutral, common policy language" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pt-primary">Primary research note</label>
                            <input id="pt-primary" value={editing.primaryResearchNote} onChange={(e) => setField("primaryResearchNote", e.target.value)} placeholder="e.g. Primary research allowed only after verification by QC" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pt-legacy">Legacy category</label>
                            <input id="pt-legacy" value={editing.legacyCategory} onChange={(e) => setField("legacyCategory", e.target.value)} placeholder="e.g. POLICY BRIEF" />
                            <span className="editor-hint">Used by the public /publications filter to match older rows that only have the legacy `category` column.</span>
                        </div>
                        <div className="form-group">
                            <label htmlFor="pt-order">Display order (lower = first)</label>
                            <input id="pt-order" type="number" value={editing.displayOrder} onChange={(e) => setField("displayOrder", Number(e.target.value) || 0)} style={{ maxWidth: 120 }} />
                        </div>
                    </div>

                    <div className="editor-section">
                        <div className="editor-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Section Scaffold ({editing.sections.length})</span>
                            <button type="button" className="btn-outline" onClick={addSection} style={{ fontSize: "0.8rem", padding: "5px 12px" }}>+ Add section</button>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                            Auto-filled into the article editor when an author picks this type. Heading is shown as an &lt;h2&gt;; placeholder becomes a faded paragraph below it.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {editing.sections.map((s, i) => (
                                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "0.75rem", background: "#fafafa" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Section {i + 1}</span>
                                        <button type="button" className="btn-outline" style={{ marginLeft: "auto", fontSize: "0.72rem", padding: "3px 10px", color: "#c44" }} onClick={() => removeSection(i)}>Remove</button>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                                        <label>Heading</label>
                                        <input value={s.heading} onChange={(e) => updateSection(i, { heading: e.target.value })} placeholder="e.g. Key Messages" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Placeholder text</label>
                                        <textarea
                                            rows={2}
                                            value={s.placeholder}
                                            onChange={(e) => updateSection(i, { placeholder: e.target.value })}
                                            placeholder="Author guidance for this section."
                                            style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: 4, fontFamily: "inherit", fontSize: "0.88rem" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="editor-save">
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : isNew ? "Create Type" : "Save Changes"}</button>
                        <button type="button" className="btn-outline" onClick={cancel}>Cancel</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-body">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">Policy Product Types</h1>
                    <p className="admin-page-desc">The types authors pick when creating an article. Edit the canonical three or add new ones — changes flow to the editor picker and the public /publications filter automatically.</p>
                </div>
                <button className="btn-primary" onClick={startNew}>+ New Type</button>
            </div>

            {loading ? (
                <p className="admin-page-desc">Loading…</p>
            ) : items.length === 0 ? (
                <div className="admin-empty">No types yet. Create one to make the article picker work.</div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Words</th>
                            <th>Pages</th>
                            <th>Sections</th>
                            <th>Order</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.key} style={item.isArchived ? { opacity: 0.55 } : undefined}>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(item)}
                                        style={{ background: "none", border: "none", padding: 0, color: "var(--crimson)", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                                    >
                                        {item.label}
                                    </button>
                                    <br />
                                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{item.key}</span>
                                </td>
                                <td>{item.wordCount.min}{item.wordCount.max != null ? `–${item.wordCount.max}` : "+"}</td>
                                <td>{item.pageLength || "—"}</td>
                                <td>{item.sections.length}</td>
                                <td>{item.displayOrder}</td>
                                <td>
                                    {item.isArchived
                                        ? <span className="role-badge role-badge--user">Archived</span>
                                        : <span className="role-badge role-badge--admin">Active</span>}
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn" onClick={() => startEdit(item)}>Edit</button>
                                        <button className="admin-btn admin-btn--secondary" onClick={() => archive(item)}>{item.isArchived ? "Unarchive" : "Archive"}</button>
                                        <button className="admin-btn admin-btn--danger" onClick={() => destroy(item)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
