"use client";

import { useState, useEffect, FormEvent } from "react";

interface UserRow {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user";
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [passwordModal, setPasswordModal] = useState<UserRow | null>(null);
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

    const handleRoleToggle = async (user: UserRow) => {
        const newRole = user.role === "admin" ? "user" : "admin";
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id, role: newRole }),
        });
        if (res.ok) {
            fetchUsers();
            setMsg(`${user.name} is now ${newRole}.`);
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

    return (
        <div>
            {msg && (
                <div className="admin-msg" onClick={() => setMsg("")}>
                    {msg}
                </div>
            )}

            <button
                className="btn-primary"
                onClick={() => setShowAdd(!showAdd)}
                style={{ marginBottom: "1.5rem" }}
            >
                {showAdd ? "Cancel" : "+ Add User"}
            </button>

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
                            <select id="add-role" name="role">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <span
                                    className={`role-badge role-badge--${user.role}`}
                                    onClick={() => handleRoleToggle(user)}
                                    title="Click to toggle role"
                                >
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                <div className="admin-actions">
                                    <button
                                        className="admin-btn admin-btn--secondary"
                                        onClick={() => setPasswordModal(user)}
                                    >
                                        Change Password
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
