"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamMember {
    id: number;
    name: string;
    title: string;
    bio: string;
    initials: string;
    photoUrl: string;
    orderNum: number;
    isFeatured: boolean;
}

const empty: TeamMember = { id: 0, name: "", title: "", bio: "", initials: "", photoUrl: "", orderNum: 0, isFeatured: false };

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [editing, setEditing] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/team");
        const data = await res.json();
        setMembers(data.members || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        if (!editing) return;
        const method = editing.id ? "PUT" : "POST";
        await fetch("/api/team", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
        });
        setEditing(null);
        load();
    };

    const del = async (id: number) => {
        if (!confirm("Delete this team member?")) return;
        await fetch(`/api/team?id=${id}`, { method: "DELETE" });
        load();
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Team Members</h1>
                <button className="adm-btn-primary" onClick={() => setEditing({ ...empty })}>+ Add Member</button>
            </div>

            {editing && (
                <div className="adm-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
                    <h3 style={{ marginBottom: "1rem" }}>{editing.id ? "Edit" : "Add"} Team Member</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label className="adm-label">Name*</label>
                            <input className="adm-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="adm-label">Title / Role</label>
                            <input className="adm-input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="adm-label">Initials</label>
                            <input className="adm-input" value={editing.initials} placeholder="e.g. WB" onChange={(e) => setEditing({ ...editing, initials: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                            <label className="adm-label">Order</label>
                            <input className="adm-input" type="number" value={editing.orderNum} onChange={(e) => setEditing({ ...editing, orderNum: Number(e.target.value) })} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label className="adm-label">Bio</label>
                            <textarea className="adm-textarea" rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
                        </div>
                        <div>
                            <label className="adm-label">Photo URL</label>
                            <input className="adm-input" value={editing.photoUrl} placeholder="Optional" onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "1.5rem" }}>
                            <input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} />
                            <label>Featured on homepage</label>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                        <button className="adm-btn-primary" onClick={save}>Save</button>
                        <button className="adm-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {loading ? (
                <p style={{ color: "#888" }}>Loading...</p>
            ) : members.length === 0 ? (
                <p style={{ color: "#888" }}>No team members yet. Add your first member above.</p>
            ) : (
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Title</th>
                            <th>Featured</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m) => (
                            <tr key={m.id}>
                                <td>{m.orderNum}</td>
                                <td><strong>{m.name}</strong><br /><small style={{ color: "#888" }}>{m.initials}</small></td>
                                <td>{m.title}</td>
                                <td>{m.isFeatured ? "★" : "—"}</td>
                                <td>
                                    <button className="adm-btn-sm" onClick={() => setEditing({ ...m })}>Edit</button>
                                    <button className="adm-btn-sm danger" onClick={() => del(m.id)} style={{ marginLeft: "0.5rem" }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
