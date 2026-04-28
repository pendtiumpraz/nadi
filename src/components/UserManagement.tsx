"use client";

import { useState, useEffect, FormEvent } from "react";

type UserRole = "admin" | "reviewer" | "contributor" | "partner";
type UserStatus = "pending" | "active" | "suspended";

interface UserRow {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
}

const ROLE_OPTIONS: UserRole[] = ["admin", "reviewer", "contributor", "partner"];

const STATUS_LABEL: Record<UserStatus, string> = {
    pending: "Pending",
    active: "Active",
    suspended: "Suspended",
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [passwordModal, setPasswordModal] = useState<UserRow | null>(null);
    const [filter, setFilter] = useState<"all" | UserStatus>("all");
    const [msg, setMsg] = useState("");

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMsg("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: fd.get("email"),
                name: fd.get("name"),
                password: fd.get("password"),
                role: fd.get("role"),
                status: "active",
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setShowAdd(false);
            fetchUsers();
            setMsg("User added successfully.");
        } else {
            setMsg(data.error || "Failed to add user.");
        }
    };

    const handleDelete = async (user: UserRow) => {
        if (!confirm(`Delete ${user.name} (${user.email})?`)) return;
        const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
            fetchUsers();
            setMsg("User deleted.");
        } else {
            setMsg(data.error);
        }
    };

    const updateUser = async (user: UserRow, patch: { role?: UserRole; status?: UserStatus }) => {
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id, ...patch }),
        });
        const data = await res.json();
        if (res.ok) {
            fetchUsers();
            if (patch.role) setMsg(`${user.name} is now ${patch.role}.`);
            if (patch.status) setMsg(`${user.name} ${patch.status === "active" ? "activated" : patch.status === "suspended" ? "suspended" : "marked pending"}.`);
        } else {
            setMsg(data.error || "Update failed.");
        }
    };

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!passwordModal) return;
        setMsg("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/users/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: passwordModal.id,
                newPassword: fd.get("newPassword"),
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setPasswordModal(null);
            setMsg("Password changed successfully.");
        } else {
            setMsg(data.error || "Failed to change password.");
        }
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading...</p>;

    const pendingCount = users.filter((u) => u.status === "pending").length;
    const visibleUsers = filter === "all" ? users : users.filter((u) => u.status === filter);

    return (
        <div>
            {msg && (
                <div className="admin-msg" onClick={() => setMsg("")}>
                    {msg}
                </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? "Cancel" : "+ Add User"}
                </button>
                <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto" }}>
                    {(["all", "pending", "active", "suspended"] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={filter === f ? "btn-primary" : "btn-outline"}
                            style={{ fontSize: "0.8rem", padding: "5px 12px" }}
                        >
                            {f === "all" ? `All (${users.length})` : `${f.charAt(0).toUpperCase()}${f.slice(1)}${f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}`}
                        </button>
                    ))}
                </div>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="admin-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="add-name">Name</label>
                            <input type="text" id="add-name" name="name" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="add-email">Email</label>
                            <input type="email" id="add-email" name="email" required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="add-password">Password</label>
                            <input
                                type="password"
                                id="add-password"
                                name="password"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="add-role">Role</label>
                            <select id="add-role" name="role" defaultValue="contributor">
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary">
                        Add User
                    </button>
                </form>
            )}

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleUsers.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <select
                                    value={user.role}
                                    onChange={(e) => updateUser(user, { role: e.target.value as UserRole })}
                                    style={{ padding: "4px 8px", fontSize: "0.8rem", border: "1px solid var(--line)", borderRadius: 4 }}
                                >
                                    {ROLE_OPTIONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "3px 10px",
                                        borderRadius: 12,
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        background:
                                            user.status === "active" ? "rgba(40,140,80,0.12)" :
                                                user.status === "pending" ? "rgba(220,150,40,0.15)" :
                                                    "rgba(180,60,60,0.12)",
                                        color:
                                            user.status === "active" ? "#1a7a3e" :
                                                user.status === "pending" ? "#9a6a10" :
                                                    "#a83838",
                                    }}
                                >
                                    {STATUS_LABEL[user.status]}
                                </span>
                            </td>
                            <td>
                                <div className="admin-actions">
                                    {user.status === "pending" && (
                                        <button
                                            className="admin-btn"
                                            style={{ background: "#1a7a3e", color: "#fff" }}
                                            onClick={() => updateUser(user, { status: "active" })}
                                        >
                                            Activate
                                        </button>
                                    )}
                                    {user.status === "active" && (
                                        <button
                                            className="admin-btn admin-btn--secondary"
                                            onClick={() => updateUser(user, { status: "suspended" })}
                                        >
                                            Suspend
                                        </button>
                                    )}
                                    {user.status === "suspended" && (
                                        <button
                                            className="admin-btn"
                                            style={{ background: "#1a7a3e", color: "#fff" }}
                                            onClick={() => updateUser(user, { status: "active" })}
                                        >
                                            Reactivate
                                        </button>
                                    )}
                                    <button
                                        className="admin-btn admin-btn--secondary"
                                        onClick={() => setPasswordModal(user)}
                                    >
                                        Password
                                    </button>
                                    <button
                                        className="admin-btn admin-btn--danger"
                                        onClick={() => handleDelete(user)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {visibleUsers.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                                No users in this filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {passwordModal && (
                <div className="admin-modal-overlay" onClick={() => setPasswordModal(null)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Change Password for {passwordModal.name}</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label htmlFor="new-pw">New Password</label>
                                <input
                                    type="password"
                                    id="new-pw"
                                    name="newPassword"
                                    required
                                    minLength={6}
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div className="admin-modal-actions">
                                <button type="submit" className="btn-primary">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setPasswordModal(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
