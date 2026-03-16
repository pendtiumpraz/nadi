"use client";

import { useState, useEffect } from "react";

interface Subscriber {
    id: number;
    email: string;
    isActive: boolean;
    subscribedAt: string;
}

export default function NewsletterAdmin() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [filtered, setFiltered] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [total, setTotal] = useState(0);
    const [active, setActive] = useState(0);

    const fetchSubscribers = async () => {
        try {
            const res = await fetch("/api/newsletter");
            const data = await res.json();
            setSubscribers(data.subscribers || []);
            setTotal(data.total || 0);
            setActive(data.active || 0);
        } catch {
            setMsg("Failed to load subscribers.");
        }
        setLoading(false);
    };

    useEffect(() => { fetchSubscribers(); }, []);

    useEffect(() => {
        let list = subscribers;
        if (filter === "active") list = list.filter((s) => s.isActive);
        if (filter === "inactive") list = list.filter((s) => !s.isActive);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.email.toLowerCase().includes(q));
        }
        setFiltered(list);
    }, [subscribers, search, filter]);

    const handleToggle = async (id: number, currentActive: boolean) => {
        const res = await fetch("/api/newsletter", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isActive: !currentActive }),
        });
        if (res.ok) {
            setMsg(`Subscriber ${currentActive ? "deactivated" : "activated"}.`);
            fetchSubscribers();
        } else {
            setMsg("Failed to update subscriber.");
        }
    };

    const handleDelete = async (id: number, email: string) => {
        if (!confirm(`Remove "${email}" from newsletter? This cannot be undone.`)) return;
        const res = await fetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            setMsg("Subscriber removed.");
            fetchSubscribers();
        } else {
            setMsg("Failed to remove subscriber.");
        }
    };

    const handleExportCSV = () => {
        const rows = [["Email", "Status", "Subscribed At"]];
        filtered.forEach((s) => {
            rows.push([s.email, s.isActive ? "Active" : "Inactive", new Date(s.subscribedAt).toLocaleString()]);
        });
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading subscribers...</p>;

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            {/* Stats */}
            <div className="admin-stats" style={{ marginBottom: "1.5rem" }}>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{total}</span>
                    <span className="admin-stat-label">Total Subscribers</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{active}</span>
                    <span className="admin-stat-label">Active</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{total - active}</span>
                    <span className="admin-stat-label">Inactive</span>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: "1 1 200px",
                        padding: "0.6rem 0.9rem",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        background: "var(--bg)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                    }}
                />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as "all" | "active" | "inactive")}
                    style={{
                        padding: "0.6rem 0.9rem",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        background: "var(--bg)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                    }}
                >
                    <option value="all">All</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                    <a href="/admin/newsletter/compose" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.55rem 1rem", textDecoration: "none" }}>
                        ✉️ Kirim Broadcast
                    </a>
                    <button className="btn-outline" onClick={handleExportCSV} style={{ fontSize: "0.8rem", padding: "0.55rem 1rem" }}>
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="admin-empty">
                    <p>No subscribers found{search ? " matching your search" : ""}.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Subscribed</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((s) => (
                            <tr key={s.id}>
                                <td><strong>{s.email}</strong></td>
                                <td>
                                    <span className={`role-badge ${s.isActive ? "role-badge--admin" : "role-badge--user"}`}>
                                        {s.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td>{new Date(s.subscribedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button
                                            className={`admin-btn ${s.isActive ? "admin-btn--secondary" : "admin-btn--primary"}`}
                                            onClick={() => handleToggle(s.id, s.isActive)}
                                        >
                                            {s.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                        <button
                                            className="admin-btn admin-btn--danger"
                                            onClick={() => handleDelete(s.id, s.email)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                Showing {filtered.length} of {total} subscribers
            </p>
        </div>
    );
}
