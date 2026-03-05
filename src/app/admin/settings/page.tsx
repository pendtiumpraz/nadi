"use client";

import { useState, useEffect } from "react";

const MODES = [
    { value: "v2", label: "V2 — Light Theme (New)", desc: "Modern light design with ECG visualization, team cards, and partner marquee." },
    { value: "v1", label: "V1 — Dark Theme (Original)", desc: "Original dark corporate design with gradient backgrounds." },
    { value: "maintenance", label: "Under Development", desc: "Shows maintenance/coming soon page to all visitors." },
];

export default function AdminSettingsPage() {
    const [version, setVersion] = useState("v2");
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => { setVersion(data.settings?.landing_version || "v2"); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);

    const save = async (val: string) => {
        setVersion(val);
        setSaving(true);
        setStatus("Saving...");
        await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "landing_version", value: val }),
        });
        setSaving(false);
        setStatus("✓ Saved!");
        setTimeout(() => setStatus(""), 2000);
    };

    if (!loaded) return <div className="admin-body"><p className="admin-page-desc">Loading settings...</p></div>;

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Site Settings</h1>
            <p className="admin-page-desc">Configure how the public-facing site behaves.</p>

            <div className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Landing Page Mode</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.2rem" }}>
                        Choose which landing page visitors see when they open the homepage.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {MODES.map((m) => (
                            <label key={m.value} style={{
                                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                padding: "0.9rem 1rem",
                                border: `1px solid ${version === m.value ? "var(--crimson, #8B1C1C)" : "var(--line, #333)"}`,
                                borderRadius: "4px", cursor: "pointer",
                                background: version === m.value ? "rgba(139,28,28,0.1)" : "transparent",
                                transition: "all 0.15s",
                            }}>
                                <input type="radio" name="landing" value={m.value} checked={version === m.value}
                                    onChange={() => save(m.value)} style={{ marginTop: "3px", accentColor: "#8B1C1C" }} />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.15rem" }}>{m.label}</div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{m.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {(status || saving) && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
        </div>
    );
}
