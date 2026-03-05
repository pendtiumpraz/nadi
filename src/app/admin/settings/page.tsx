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

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setVersion(data.settings?.landing_version || "v2");
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const save = async (val: string) => {
        setVersion(val);
        setSaving(true);
        await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "landing_version", value: val }),
        });
        setSaving(false);
    };

    if (!loaded) return <p style={{ color: "#888" }}>Loading settings...</p>;

    return (
        <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem" }}>Site Settings</h1>

            <div className="adm-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "0.3rem" }}>Landing Page Mode</h3>
                <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Choose which landing page visitors see when they visit the homepage.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {MODES.map((m) => (
                        <label key={m.value} style={{
                            display: "flex", alignItems: "flex-start", gap: "1rem",
                            padding: "1rem 1.2rem", border: `1px solid ${version === m.value ? "var(--crimson, #8B1C1C)" : "#333"}`,
                            borderRadius: "4px", cursor: "pointer",
                            background: version === m.value ? "rgba(139,28,28,0.08)" : "transparent",
                            transition: "all 0.15s",
                        }}>
                            <input type="radio" name="landing" value={m.value} checked={version === m.value}
                                onChange={() => save(m.value)}
                                style={{ marginTop: "3px", accentColor: "#8B1C1C" }} />
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{m.label}</div>
                                <div style={{ fontSize: "0.82rem", color: "#888" }}>{m.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>

                {saving && <p style={{ color: "#8B1C1C", marginTop: "1rem", fontSize: "0.85rem" }}>Saving...</p>}
            </div>
        </div>
    );
}
