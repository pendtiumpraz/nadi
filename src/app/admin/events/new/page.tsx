"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
    const router = useRouter();
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setStatus("Saving event...");
        try {
            const form = new FormData(e.currentTarget);
            const res = await fetch("/api/events", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("✓ Event created!");
            setTimeout(() => router.push("/admin/events"), 1000);
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Create Event</h1>
            <p className="admin-page-desc">Add a new event with details and cover image.</p>
            <form onSubmit={handleSubmit} className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Event Details</div>
                    <div className="form-group"><label>Title *</label><input name="title" required placeholder="e.g. NADI Health Policy Forum 2026" /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Date *</label><input name="date" type="date" required /></div>
                        <div className="form-group"><label>Time</label><input name="time" placeholder="e.g. 09:00 - 17:00 WIB" /></div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Location</label><input name="location" placeholder="e.g. Jakarta Convention Center" /></div>
                        <div className="form-group"><label>Location Type</label>
                            <select name="locationType"><option value="onsite">Onsite</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select>
                        </div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Category</label>
                            <select name="category"><option value="conference">Conference</option><option value="seminar">Seminar</option><option value="workshop">Workshop</option><option value="roundtable">Roundtable</option><option value="launch">Launch</option><option value="other">Other</option></select>
                        </div>
                        <div className="form-group"><label>Status</label>
                            <select name="status"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
                        </div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea name="description" rows={4} placeholder="Event description..." style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Speakers (comma-separated)</label><input name="speakers" placeholder="Dr. Smith, Prof. Lee" /></div>
                        <div className="form-group"><label>Organizer</label><input name="organizer" defaultValue="NADI" /></div>
                    </div>
                    <div className="form-group"><label>Registration URL</label><input name="registrationUrl" placeholder="https://..." /></div>
                </div>

                <div className="editor-section">
                    <div className="editor-section-title">Cover Image</div>
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{ marginTop: "1rem", maxWidth: "100%", maxHeight: "300px", borderRadius: "6px", border: "1px solid var(--line)" }} />}
                </div>

                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Create Event"}</button>
                    <a href="/admin/events" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
