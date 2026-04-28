"use client";

import { useEffect, useState } from "react";

interface MenuItem { key: string; label: string }
type Role = "admin" | "reviewer" | "contributor" | "partner";
type Matrix = Record<Role, string[]>;

const ROLE_DESCRIPTIONS: Record<Role, string> = {
    admin: "Full platform control. Always has access to every page (locked).",
    reviewer: "Approves submitted content; manages review queue.",
    contributor: "Creates and submits content for review; cannot publish directly.",
    partner: "External collaborator with limited dashboard access.",
};

export default function PermissionsMatrix() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [matrix, setMatrix] = useState<Matrix | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetch("/api/permissions")
            .then((r) => r.json())
            .then((d) => {
                setMenus(d.menus);
                setRoles(d.roles);
                setMatrix(d.matrix);
            })
            .catch(() => setMsg("Failed to load matrix."))
            .finally(() => setLoading(false));
    }, []);

    const toggle = (role: Role, key: string) => {
        if (role === "admin") return;
        if (!matrix) return;
        const has = matrix[role].includes(key);
        const next = { ...matrix, [role]: has ? matrix[role].filter((k) => k !== key) : [...matrix[role], key] };
        setMatrix(next);
    };

    const save = async () => {
        if (!matrix) return;
        setSaving(true);
        setMsg("");
        try {
            const res = await fetch("/api/permissions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matrix }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            setMsg("✓ Saved. Sidebar will update on next page load.");
        } catch (err) {
            setMsg(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    if (loading) return <p style={{ color: "var(--muted)" }}>Loading matrix...</p>;
    if (!matrix) return <p style={{ color: "var(--muted)" }}>{msg || "No matrix found."}</p>;

    return (
        <div>
            {msg && <div className="admin-msg" onClick={() => setMsg("")}>{msg}</div>}

            <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 720 }}>
                    <thead>
                        <tr>
                            <th style={{ minWidth: 200 }}>Menu / Page</th>
                            {roles.map((r) => (
                                <th key={r} style={{ textAlign: "center", textTransform: "capitalize" }}>{r}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                            <td style={{ fontStyle: "italic", color: "var(--muted)", fontSize: "0.78rem" }}>Description</td>
                            {roles.map((r) => (
                                <td key={r} style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.75rem", padding: "0.5rem", lineHeight: 1.4 }}>
                                    {ROLE_DESCRIPTIONS[r]}
                                </td>
                            ))}
                        </tr>
                        {menus.map((m) => (
                            <tr key={m.key}>
                                <td style={{ fontWeight: 600 }}>{m.label}</td>
                                {roles.map((role) => {
                                    const checked = matrix[role].includes(m.key);
                                    const locked = role === "admin";
                                    return (
                                        <td key={role} style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={locked}
                                                onChange={() => toggle(role, m.key)}
                                                style={{ width: 18, height: 18, cursor: locked ? "not-allowed" : "pointer" }}
                                                aria-label={`${role} can access ${m.label}`}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
                <button className="btn-primary" onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save Matrix"}
                </button>
                <a href="/admin" className="btn-outline">Cancel</a>
            </div>
        </div>
    );
}
