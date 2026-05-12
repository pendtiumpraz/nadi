"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamMember {
    id: number;
    name: string;
    title: string;
    bio: string;
    initials: string;
    photoUrl: string;
    linkedinUrl: string;
    orderNum: number;
    isFeatured: boolean;
}

const empty: TeamMember = { id: 0, name: "", title: "", bio: "", initials: "", photoUrl: "", linkedinUrl: "", orderNum: 0, isFeatured: false };

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [editing, setEditing] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/team");
        const data = await res.json();
        setMembers(data.members || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        if (!editing || !editing.name.trim()) return;
        setSaving(true);
        setStatus("Saving...");
        const method = editing.id ? "PUT" : "POST";
        await fetch("/api/team", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
        });
        setStatus("✓ Saved!");
        setEditing(null);
        setSaving(false);
        load();
        setTimeout(() => setStatus(""), 2000);
    };

    const del = async (id: number) => {
        if (!confirm("Delete this team member?")) return;
        await fetch(`/api/team?id=${id}`, { method: "DELETE" });
        load();
    };

    return (
        <div className="admin-body">
            <div className="admin-content-header">
                <h1 className="admin-page-title">Team Members</h1>
                {!editing && (
                    <button className="btn-primary" onClick={() => setEditing({ ...empty })}>+ New Member</button>
                )}
            </div>

            {editing && (
                <form className="editor" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <div className="editor-section">
                        <div className="editor-section-title">{editing.id ? "Edit" : "Add"} Team Member</div>
                        <div className="editor-grid">
                            <div className="form-group"><label>Full Name *</label><input value={editing.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                            <div className="form-group"><label>Title / Role</label><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                        </div>
                        <div className="editor-grid">
                            <div className="form-group"><label>Initials</label><input value={editing.initials} placeholder="e.g. WB" onChange={(e) => setEditing({ ...editing, initials: e.target.value.toUpperCase() })} /></div>
                            <div className="form-group"><label>Display Order</label><input type="number" value={editing.orderNum} onChange={(e) => setEditing({ ...editing, orderNum: Number(e.target.value) })} /></div>
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <textarea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} />
                        </div>
                        <div className="editor-grid">
                            <div className="form-group"><label>Photo URL</label><input value={editing.photoUrl} placeholder="Optional — leave blank for initials avatar" onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })} /></div>
                            <div className="form-group"><label>LinkedIn URL</label><input value={editing.linkedinUrl} placeholder="https://linkedin.com/in/..." onChange={(e) => setEditing({ ...editing, linkedinUrl: e.target.value })} /></div>
                        </div>
                        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input type="checkbox" id="featured" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} />
                            <label htmlFor="featured" style={{ margin: 0, textTransform: "none", letterSpacing: "0" }}>Featured on homepage</label>
                        </div>
                    </div>

                    {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                    <div className="editor-save">
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : editing.id ? "Update Member" : "Add Member"}</button>
                        <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                </form>
            )}

            {!editing && (
                loading ? <p className="admin-page-desc">Loading...</p> : members.length === 0 ? (
                    <div className="admin-empty">No team members yet. Create your first member!</div>
                ) : (
                    <table className="admin-table">
                        <thead><tr><th>#</th><th>Name</th><th>Title</th><th>LinkedIn</th><th>Featured</th><th>Actions</th></tr></thead>
                        <tbody>
                            {members.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.orderNum}</td>
                                    <td><strong>{m.name}</strong><br /><span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{m.initials}</span></td>
                                    <td>{m.title}</td>
                                    <td>{m.linkedinUrl ? <a href={m.linkedinUrl} target="_blank" rel="noopener" style={{ fontSize: "0.72rem", color: "var(--crimson)" }}>View</a> : <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>—</span>}</td>
                                    <td><span className={`role-badge role-badge--${m.isFeatured ? "admin" : "user"}`}>{m.isFeatured ? "Homepage + Team" : "Team Only"}</span></td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="admin-btn" onClick={() => setEditing({ ...m })}>Edit</button>
                                            <button className="admin-btn admin-btn--danger" onClick={() => del(m.id)}>Del</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            )}
        </div>
    );
}
