"use client";

import { useState, useEffect, FormEvent } from "react";
import Pagination from "@/components/Pagination";
import { useToast, confirmDialog } from "@/components/Toast";
import PasswordInput from "@/components/PasswordInput";
import { ADMIN_ASSIGNABLE_ROLES } from "@/lib/role-config";

type UserRole = "admin" | "reviewer" | "contributor" | "partner";
type UserStatus = "pending" | "active" | "suspended";

const PER_PAGE = 20;

interface UserRow {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
}

// Roles offered in the add/edit selectors. Existing users with a role no
// longer listed here (e.g. 'partner' before its hide) still render correctly
// in the table; admin can switch them to a listed role to migrate.
const ROLE_OPTIONS: UserRole[] = ADMIN_ASSIGNABLE_ROLES;

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
    const [editModal, setEditModal] = useState<UserRow | null>(null);
    const [filter, setFilter] = useState<"all" | UserStatus>("all");
    const toast = useToast();
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Escape-to-close for the change-password modal.
    useEffect(() => {
        if (!passwordModal) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPasswordModal(null);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [passwordModal]);

    // Same Escape-to-close behaviour for the edit-profile modal.
    useEffect(() => {
        if (!editModal) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setEditModal(null);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [editModal]);

    const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setShowAdd(false);
            fetchUsers();
            toast.success("User added successfully.");
        } else {
            toast.error(data.error || "Failed to add user.");
        }
    };

    const handleDelete = async (user: UserRow) => {
        const ok = await confirmDialog({
            title: "Delete user?",
            message: `${user.name} (${user.email}) will be permanently removed.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!ok) return;
        const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            fetchUsers();
            toast.success("User deleted.");
        } else {
            toast.error(data.error || "Failed to delete user.");
        }
    };

    const updateUser = async (user: UserRow, patch: { role?: UserRole; status?: UserStatus }) => {
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id, ...patch }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            fetchUsers();
            if (patch.role) toast.success(`${user.name} is now ${patch.role}.`);
            if (patch.status) toast.success(`${user.name} ${patch.status === "active" ? "activated" : patch.status === "suspended" ? "suspended" : "marked pending"}.`);
        } else {
            toast.error(data.error || "Update failed.");
        }
    };

    const handleEditUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editModal) return;
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        const email = String(fd.get("email") || "").trim();
        const role = String(fd.get("role") || "") as UserRole;
        const status = String(fd.get("status") || "") as UserStatus;
        if (!name || !email) {
            toast.error("Name and email are required.");
            return;
        }
        const res = await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editModal.id, name, email, role, status }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setEditModal(null);
            fetchUsers();
            toast.success("User updated.");
        } else {
            toast.error(data.error || "Failed to update user.");
        }
    };

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!passwordModal) return;
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/users/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: passwordModal.id,
                newPassword: fd.get("newPassword"),
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setPasswordModal(null);
            toast.success("Password changed successfully.");
        } else {
            toast.error(data.error || "Failed to change password.");
        }
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading...</p>;

    const pendingCount = users.filter((u) => u.status === "pending").length;
    const visibleUsers = filter === "all" ? users : users.filter((u) => u.status === filter);
    const paginatedUsers = visibleUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div>
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
                            <PasswordInput
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
                    {paginatedUsers.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <button
                                    type="button"
                                    onClick={() => setEditModal(user)}
                                    style={{ background: "none", border: "none", padding: 0, color: "var(--crimson)", fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                                >
                                    {user.name}
                                </button>
                            </td>
                            <td>{user.email}</td>
                            <td>
                                <select
                                    value={user.role}
                                    onChange={(e) => updateUser(user, { role: e.target.value as UserRole })}
                                    style={{ padding: "4px 8px", fontSize: "0.8rem", border: "1px solid var(--line)", borderRadius: 4 }}
                                >
                                    {/* Surface the user's current role even when it's not in
                                        ADMIN_ASSIGNABLE_ROLES (e.g. legacy 'partner') so the
                                        admin can see and migrate them. */}
                                    {!ROLE_OPTIONS.includes(user.role) && (
                                        <option key={user.role} value={user.role}>{user.role} (legacy)</option>
                                    )}
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
                                        className="admin-btn"
                                        onClick={() => setEditModal(user)}
                                    >
                                        Edit
                                    </button>
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

            {visibleUsers.length > 0 && (
                <Pagination
                    page={page}
                    total={visibleUsers.length}
                    perPage={PER_PAGE}
                    onPageChange={setPage}
                    itemLabel="users"
                />
            )}

            {editModal && (
                <div
                    className="admin-modal-overlay"
                    onClick={() => setEditModal(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-user-title"
                    tabIndex={-1}
                >
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 id="edit-user-title">Edit {editModal.name}</h3>
                        <form onSubmit={handleEditUser}>
                            <div className="form-group">
                                <label htmlFor="edit-name">Name</label>
                                <input
                                    type="text"
                                    id="edit-name"
                                    name="name"
                                    defaultValue={editModal.name}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-email">Email</label>
                                <input
                                    type="email"
                                    id="edit-email"
                                    name="email"
                                    defaultValue={editModal.email}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="edit-role">Role</label>
                                    <select id="edit-role" name="role" defaultValue={editModal.role}>
                                        {!ROLE_OPTIONS.includes(editModal.role) && (
                                            <option key={editModal.role} value={editModal.role}>{editModal.role} (legacy)</option>
                                        )}
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-status">Status</label>
                                    <select id="edit-status" name="status" defaultValue={editModal.status}>
                                        <option value="pending">pending</option>
                                        <option value="active">active</option>
                                        <option value="suspended">suspended</option>
                                    </select>
                                </div>
                            </div>
                            <div className="admin-modal-actions">
                                <button type="submit" className="btn-primary">
                                    Save changes
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setEditModal(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {passwordModal && (
                <div
                    className="admin-modal-overlay"
                    onClick={() => setPasswordModal(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="change-pw-title"
                    tabIndex={-1}
                >
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 id="change-pw-title">Change Password for {passwordModal.name}</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label htmlFor="new-pw">New Password</label>
                                <PasswordInput
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
