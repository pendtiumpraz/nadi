"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast, confirmDialog } from "@/components/Toast";

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
    const toast = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/team");
        const data = await res.json();
        setMembers(data.members || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        if (!editing || !editing.name.trim()) {
            toast.error("Full name is required.");
            return;
        }
        setSaving(true);
        const method = editing.id ? "PUT" : "POST";
        const res = await fetch("/api/team", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
        });
        setSaving(false);
        if (res.ok) {
            toast.success(method === "POST" ? "Member added." : "Member updated.");
            setEditing(null);
            load();
        } else {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || "Failed to save member.");
        }
    };

    const del = async (id: number) => {
        const ok = await confirmDialog({
            title: "Delete team member?",
            message: "This will permanently remove the member.",
            confirmText: "Delete",
            tone: "danger",
        });
        if (!ok) return;
        const res = await fetch(`/api/team?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Member removed.");
            load();
        } else {
            toast.error("Failed to delete member.");
        }
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
                            <div className="form-group"><label htmlFor="team-name">Full Name *</label><input id="team-name" value={editing.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                            <div className="form-group"><label htmlFor="team-title">Title / Role</label><input id="team-title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                        </div>
                        <div className="editor-grid">
                            <div className="form-group"><label htmlFor="team-initials">Initials</label><input id="team-initials" value={editing.initials} placeholder="e.g. WB" onChange={(e) => setEditing({ ...editing, initials: e.target.value.toUpperCase() })} /></div>
                            <div className="form-group"><label htmlFor="team-order">Display Order</label><input id="team-order" type="number" value={editing.orderNum} onChange={(e) => setEditing({ ...editing, orderNum: Number(e.target.value) })} /></div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="team-bio">Bio</label>
                            <textarea id="team-bio" rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                                style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} />
                        </div>
                        <div className="editor-grid">
                            <div className="form-group"><label htmlFor="team-photo">Photo URL</label><input id="team-photo" value={editing.photoUrl} placeholder="Optional — leave blank for initials avatar" onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })} /></div>
                            <div className="form-group"><label htmlFor="team-linkedin">LinkedIn URL</label><input id="team-linkedin" value={editing.linkedinUrl} placeholder="https://linkedin.com/in/..." onChange={(e) => setEditing({ ...editing, linkedinUrl: e.target.value })} /></div>
                        </div>
                        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input type="checkbox" id="featured" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} />
                            <label htmlFor="featured" style={{ margin: 0, textTransform: "none", letterSpacing: "0" }}>Featured on homepage</label>
                        </div>
                    </div>

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
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => setEditing({ ...m })}
                                            style={{ background: "none", border: "none", padding: 0, color: "var(--crimson)", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                                        >
                                            {m.name}
                                        </button>
                                        <br />
                                        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{m.initials}</span>
                                    </td>
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
