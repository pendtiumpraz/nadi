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

interface CCRecipient { name: string; email: string }
interface ThrottleThreshold { after: number; lockoutSeconds: number }
interface ThrottleSettings { windowSeconds: number; thresholds: ThrottleThreshold[] }

export default function AdminSettingsPage() {
    const [landingVersion, setLandingVersion] = useState("v2");
    const [adminTheme, setAdminTheme] = useState("v1");
    const [ccList, setCcList] = useState<CCRecipient[]>([]);
    const [reviewEta, setReviewEta] = useState("7");
    const [privacyTermsMd, setPrivacyTermsMd] = useState("");
    const [throttle, setThrottle] = useState<ThrottleSettings>({ windowSeconds: 3600, thresholds: [] });
    const [recentFailures, setRecentFailures] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setLandingVersion(data.settings?.landing_version || "v2");
                setAdminTheme(data.settings?.admin_theme || "v1");
                setReviewEta(data.settings?.review_eta_days || "7");
                setPrivacyTermsMd(data.settings?.privacy_terms_md || "");
                try {
                    const parsed = JSON.parse(data.settings?.notification_cc || "[]");
                    setCcList(Array.isArray(parsed) ? parsed : []);
                } catch {
                    setCcList([]);
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
        // Throttle settings live behind a separate admin endpoint
        fetch("/api/admin/security")
            .then((r) => r.json())
            .then((d) => {
                if (d.settings) setThrottle(d.settings);
                if (typeof d.recentFailures === "number") setRecentFailures(d.recentFailures);
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    const updateThreshold = (idx: number, patch: Partial<ThrottleThreshold>) => {
        setThrottle({ ...throttle, thresholds: throttle.thresholds.map((t, i) => i === idx ? { ...t, ...patch } : t) });
    };
    const addThreshold = () => {
        const last = throttle.thresholds[throttle.thresholds.length - 1];
        const nextAfter = last ? last.after + 5 : 3;
        const nextLockout = last ? Math.min(last.lockoutSeconds * 6, 86400) : 30;
        setThrottle({ ...throttle, thresholds: [...throttle.thresholds, { after: nextAfter, lockoutSeconds: nextLockout }] });
    };
    const removeThreshold = (idx: number) => {
        setThrottle({ ...throttle, thresholds: throttle.thresholds.filter((_, i) => i !== idx) });
    };
    const saveThrottle = async () => {
        setStatus("Saving security...");
        const res = await fetch("/api/admin/security", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: throttle }),
        });
        if (res.ok) {
            setStatus("✓ Login throttle updated.");
            setTimeout(() => setStatus(""), 3000);
        } else {
            const d = await res.json();
            setStatus(`Error: ${d.error || "Failed to save"}`);
        }
    };

    const saveCcList = async (list: CCRecipient[]) => {
        setCcList(list);
        await saveSetting("notification_cc", JSON.stringify(list));
    };
    const updateCcEntry = (idx: number, patch: Partial<CCRecipient>) => {
        const next = ccList.map((c, i) => (i === idx ? { ...c, ...patch } : c));
        setCcList(next);
    };
    const addCcEntry = () => setCcList([...ccList, { name: "", email: "" }]);
    const removeCcEntry = (idx: number) => saveCcList(ccList.filter((_, i) => i !== idx));

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

            {/* Notification CC List */}
            <div className="editor" style={{ marginBottom: "2rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Notification CC list</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                        These addresses are CC&apos;d on every signup, article submission, and approval email. Editable on the fly.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {ccList.map((c, idx) => (
                            <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <input
                                    placeholder="Name"
                                    value={c.name}
                                    onChange={(e) => updateCcEntry(idx, { name: e.target.value })}
                                    onBlur={() => saveCcList(ccList)}
                                    style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
                                />
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={c.email}
                                    onChange={(e) => updateCcEntry(idx, { email: e.target.value })}
                                    onBlur={() => saveCcList(ccList)}
                                    style={{ flex: 2, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeCcEntry(idx)}
                                    className="btn-outline"
                                    style={{ fontSize: "0.8rem", padding: "6px 12px", color: "#c44" }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {ccList.length === 0 && (
                            <p style={{ color: "var(--muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                                No recipients yet. Add at least one.
                            </p>
                        )}
                    </div>
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                        <button type="button" className="btn-outline" onClick={addCcEntry} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>+ Add Recipient</button>
                        <button type="button" className="btn-primary" onClick={() => saveCcList(ccList)} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>Save Now</button>
                    </div>
                </div>
            </div>

            {/* Review ETA (days) */}
            <div className="editor" style={{ marginBottom: "2rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Review ETA (days)</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                        Sent in the auto-reply email at submit: &ldquo;We will review your work and get back to you in <strong>X</strong> days.&rdquo; Editable on the fly.
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                            type="number"
                            min={1}
                            value={reviewEta}
                            onChange={(e) => setReviewEta(e.target.value)}
                            style={{ width: 100, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}
                        />
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => saveSetting("review_eta_days", reviewEta)}
                            style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Security — login throttle */}
            <div className="editor" style={{ marginBottom: "2rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Security — Login Throttle</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.55 }}>
                        Escalating lockout for failed sign-in attempts. After <strong>N</strong> failures within the
                        rolling window below, the account&apos;s next sign-in is blocked for <strong>X seconds</strong>.
                        The strictest threshold matched wins. A successful sign-in clears the failure chain.
                    </p>
                    <div style={{ marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                        Last 24h: <strong>{recentFailures}</strong> failed login attempt{recentFailures === 1 ? "" : "s"}
                    </div>
                    <div className="form-group" style={{ maxWidth: 320, marginBottom: "1rem" }}>
                        <label>Failure window (seconds)</label>
                        <input
                            type="number"
                            min={60}
                            max={86400}
                            value={throttle.windowSeconds}
                            onChange={(e) => setThrottle({ ...throttle, windowSeconds: Math.max(60, Number(e.target.value) || 3600) })}
                        />
                        <span className="editor-hint">How far back to count failures (default 3600 = 1 hour).</span>
                    </div>
                    <table className="admin-table" style={{ marginBottom: "0.75rem" }}>
                        <thead>
                            <tr>
                                <th>After N failures</th>
                                <th>Lockout (seconds)</th>
                                <th>Lockout (display)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {throttle.thresholds.map((t, idx) => {
                                const display = t.lockoutSeconds < 60 ? `${t.lockoutSeconds}s`
                                    : t.lockoutSeconds < 3600 ? `${Math.round(t.lockoutSeconds / 60)} min`
                                        : `${(t.lockoutSeconds / 3600).toFixed(1).replace(/\.0$/, "")} hour`;
                                return (
                                    <tr key={idx}>
                                        <td>
                                            <input type="number" min={1} value={t.after} style={{ width: 80 }}
                                                onChange={(e) => updateThreshold(idx, { after: Math.max(1, Number(e.target.value) || 1) })} />
                                        </td>
                                        <td>
                                            <input type="number" min={1} max={604800} value={t.lockoutSeconds} style={{ width: 110 }}
                                                onChange={(e) => updateThreshold(idx, { lockoutSeconds: Math.max(1, Number(e.target.value) || 30) })} />
                                        </td>
                                        <td style={{ color: "var(--muted)", fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}>{display}</td>
                                        <td>
                                            <button type="button" onClick={() => removeThreshold(idx)} className="btn-outline" style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#c44" }}>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {throttle.thresholds.length === 0 && (
                                <tr><td colSpan={4} style={{ color: "var(--muted)", textAlign: "center", padding: "1rem", fontStyle: "italic" }}>
                                    No throttle thresholds configured — failed logins are unlimited.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="button" className="btn-outline" onClick={addThreshold} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>+ Add threshold</button>
                        <button type="button" className="btn-primary" onClick={saveThrottle} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>Save security settings</button>
                    </div>
                    <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(40,140,80,0.06)", border: "1px solid rgba(40,140,80,0.2)", borderRadius: 4, fontSize: "0.82rem", lineHeight: 1.55 }}>
                        <strong>File-upload defense</strong> is enforced in code (not configurable here):
                        <ul style={{ margin: "0.4rem 0 0 1.25rem", padding: 0 }}>
                            <li>Cover images: JPG/PNG/WebP only, max 5 MB</li>
                            <li>PDF documents: PDF only, max 20 MB</li>
                            <li>E-signatures: JPG/PNG only, max 2 MB</li>
                            <li>Guidelines: PDF/DOCX only, max 25 MB</li>
                            <li>Always blocked: <code>.php .phtml .js .svg .html .exe .sh .py</code> (and ~20 other script extensions)</li>
                            <li>SQL injection: all DB queries use parameterised neon templates — string concat in SQL is not used.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Privacy & Terms body */}
            <div className="editor" style={{ marginBottom: "2rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Privacy &amp; Terms body (popup content)</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                        Markdown content rendered inside the Privacy Policy popup that visitors see on first page load. Supports headings (# / ##), paragraphs, and line breaks.
                    </p>
                    <textarea
                        rows={12}
                        value={privacyTermsMd}
                        onChange={(e) => setPrivacyTermsMd(e.target.value)}
                        style={{
                            width: "100%",
                            fontFamily: "monospace",
                            padding: "12px",
                            border: "1px solid var(--line)",
                            borderRadius: 4,
                        }}
                    />
                    <div style={{ marginTop: "0.75rem" }}>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => saveSetting("privacy_terms_md", privacyTermsMd)}
                            style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                        >
                            Save Privacy &amp; Terms
                        </button>
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
