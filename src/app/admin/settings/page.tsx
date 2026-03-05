"use client";

import { useState, useEffect } from "react";

const LANDING_MODES = [
    { value: "v2", label: "V2 — Light Theme (New)", desc: "Modern light design with ECG visualization, team cards, and partner marquee." },
    { value: "v1", label: "V1 — Dark Theme (Original)", desc: "Original dark corporate design with gradient backgrounds." },
    { value: "maintenance", label: "Under Development", desc: "Shows maintenance/coming soon page to all visitors." },
];

const ADMIN_THEMES = [
    { value: "v1", label: "Dark (Default)", desc: "Dark sidebar and topbar with light content area." },
    { value: "v2", label: "Light (V2)", desc: "Crimson topbar, white sidebar, fully light admin panel matching V2 style." },
];

export default function AdminSettingsPage() {
    const [landingVersion, setLandingVersion] = useState("v2");
    const [adminTheme, setAdminTheme] = useState("v1");
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setLandingVersion(data.settings?.landing_version || "v2");
                setAdminTheme(data.settings?.admin_theme || "v1");
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const saveSetting = async (key: string, value: string) => {
        setStatus("Saving...");
        await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
        });
        setStatus("✓ Saved! Refresh to see changes.");
        setTimeout(() => setStatus(""), 3000);
    };

    if (!loaded) return <div className="admin-body"><p className="admin-page-desc">Loading settings...</p></div>;

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Site Settings</h1>
            <p className="admin-page-desc">Configure how the public-facing site and admin panel look.</p>

            {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}

            {/* Landing Page Mode */}
            <div className="editor" style={{ marginBottom: "2rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Landing Page Mode</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.2rem" }}>
                        Choose which landing page visitors see when they open the homepage.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {LANDING_MODES.map((m) => (
                            <label key={m.value} style={{
                                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                padding: "0.8rem 1rem",
                                border: `1px solid ${landingVersion === m.value ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                                borderRadius: "4px", cursor: "pointer",
                                background: landingVersion === m.value ? "rgba(139,28,28,0.06)" : "transparent",
                                transition: "all 0.15s",
                            }}>
                                <input type="radio" name="landing" value={m.value} checked={landingVersion === m.value}
                                    onChange={() => { setLandingVersion(m.value); saveSetting("landing_version", m.value); }}
                                    style={{ marginTop: "3px", accentColor: "#8B1C1C" }} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.1rem" }}>{m.label}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{m.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Admin Theme */}
            <div className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Admin Panel Theme</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.2rem" }}>
                        Choose the visual style for the admin panel. Refresh the page after changing.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {ADMIN_THEMES.map((t) => (
                            <label key={t.value} style={{
                                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                padding: "0.8rem 1rem",
                                border: `1px solid ${adminTheme === t.value ? "var(--crimson, #8B1C1C)" : "var(--line, #ddd)"}`,
                                borderRadius: "4px", cursor: "pointer",
                                background: adminTheme === t.value ? "rgba(139,28,28,0.06)" : "transparent",
                                transition: "all 0.15s",
                            }}>
                                <input type="radio" name="admin_theme" value={t.value} checked={adminTheme === t.value}
                                    onChange={() => { setAdminTheme(t.value); saveSetting("admin_theme", t.value); }}
                                    style={{ marginTop: "3px", accentColor: "#8B1C1C" }} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.1rem" }}>{t.label}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{t.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
