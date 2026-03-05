"use client";

import { useState } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

export default function ContactPageClient() {
    const [form, setForm] = useState({ name: "", email: "", org: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        try {
            const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", org: "", subject: "", message: "" }); }
            else setStatus("error");
        } catch { setStatus("error"); }
    };

    return (
        <V2PageLayout title="Let's start a <em>conversation</em>" eyebrow="Get in Touch">
            <div className="v2-contact-grid">
                <div className="v2-contact-info">
                    <p>For institutional partnership, advisory engagement, or collaborative inquiry — we welcome your message.</p>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem 0", borderBottom: "1px solid #E8E5E1" }}>
                            <span>✉</span>
                            <div>
                                <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B1C1C" }}>Email</div>
                                <div style={{ fontSize: "0.9rem" }}>info@nadi-health.id</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem 0", borderBottom: "1px solid #E8E5E1" }}>
                            <span>🌐</span>
                            <div>
                                <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8B1C1C" }}>Website</div>
                                <div style={{ fontSize: "0.9rem" }}>www.nadi-health.id</div>
                            </div>
                        </div>
                    </div>

                    <h3>Types of Engagement</h3>
                    <ul className="v2-contact-types">
                        <li>Institutional Partnership</li>
                        <li>Advisory Engagement</li>
                        <li>Media &amp; Press</li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="v2-form-group">
                            <label className="v2-form-label">Full Name *</label>
                            <input className="v2-form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="v2-form-group">
                            <label className="v2-form-label">Email *</label>
                            <input className="v2-form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="v2-form-group">
                        <label className="v2-form-label">Organization</label>
                        <input className="v2-form-input" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} />
                    </div>
                    <div className="v2-form-group">
                        <label className="v2-form-label">Subject *</label>
                        <select className="v2-form-select" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                            <option value="">Select a subject</option>
                            <option value="Institutional Partnership">Institutional Partnership</option>
                            <option value="Advisory Engagement">Advisory Engagement</option>
                            <option value="Media & Press">Media &amp; Press</option>
                            <option value="General Inquiry">General Inquiry</option>
                        </select>
                    </div>
                    <div className="v2-form-group">
                        <label className="v2-form-label">Message *</label>
                        <textarea className="v2-form-textarea" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    </div>
                    <button type="submit" className="v2-btn-primary" disabled={status === "sending"} style={{ border: "none", cursor: "pointer", width: "100%" }}>
                        {status === "sending" ? "Sending..." : status === "sent" ? "✓ Sent!" : "Send Message"}
                    </button>
                    {status === "error" && <p style={{ color: "#c0392b", marginTop: "0.5rem", fontSize: "0.85rem" }}>Failed to send. Please try again.</p>}
                    {status === "sent" && <p style={{ color: "#2C7A4B", marginTop: "0.5rem", fontSize: "0.85rem" }}>Thank you! We&apos;ll be in touch.</p>}
                </form>
            </div>
        </V2PageLayout>
    );
}
