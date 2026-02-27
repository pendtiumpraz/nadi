"use client";

import { useState, FormEvent } from "react";

type FormStatus = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
    const [status, setStatus] = useState<FormStatus>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        organization: "",
        subject: "",
        message: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus("sending");
        setErrorMsg("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", organization: "", subject: "", message: "" });
            } else {
                setStatus("error");
                setErrorMsg(data.error || "Something went wrong.");
            }
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="contact-success">
                <div className="contact-success-icon">✓</div>
                <h3>Message Sent</h3>
                <p>
                    Thank you for reaching out. We will review your message and respond
                    within 2–3 business days.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => setStatus("idle")}
                    style={{ marginTop: "1.5rem" }}
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="organization">Organization</label>
                    <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Your organization (optional)"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a subject</option>
                        <option value="Institutional Partnership">Institutional Partnership</option>
                        <option value="Advisory Engagement">Advisory Engagement</option>
                        <option value="Collaborative Inquiry">Collaborative Inquiry</option>
                        <option value="Media & Press">Media &amp; Press</option>
                        <option value="Join the Team">Join the Team</option>
                        <option value="General Inquiry">General Inquiry</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us about your inquiry..."
                />
            </div>

            {status === "error" && (
                <div className="form-error">
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                className="btn-primary contact-submit"
                disabled={status === "sending"}
            >
                {status === "sending" ? "Sending..." : "Send Message"}
            </button>
        </form>
    );
}
