"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function NewEventPage() {
    const router = useRouter();
    const toast = useToast();
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        try {
            const form = new FormData(e.currentTarget);
            const res = await fetch("/api/events", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Event created.");
            setTimeout(() => router.push("/admin/events"), 600);
        } catch (err) {
            toast.error((err as Error).message);
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
                    <div className="form-group"><label htmlFor="event-title">Title *</label><input id="event-title" name="title" required placeholder="e.g. NADI Health Policy Forum 2026" /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="event-date">Date *</label><input id="event-date" name="date" type="date" required /></div>
                        <div className="form-group"><label htmlFor="event-time">Time</label><input id="event-time" name="time" placeholder="e.g. 09:00 - 17:00 WIB" /></div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="event-location">Location</label><input id="event-location" name="location" placeholder="e.g. Jakarta Convention Center" /></div>
                        <div className="form-group"><label htmlFor="event-location-type">Location Type</label>
                            <select id="event-location-type" name="locationType"><option value="onsite">Onsite</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select>
                        </div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="event-category">Category</label>
                            <select id="event-category" name="category"><option value="conference">Conference</option><option value="seminar">Seminar</option><option value="workshop">Workshop</option><option value="roundtable">Roundtable</option><option value="launch">Launch</option><option value="other">Other</option></select>
                        </div>
                        <div className="form-group"><label htmlFor="event-status">Status</label>
                            <select id="event-status" name="status"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
                        </div>
                    </div>
                    <div className="form-group"><label htmlFor="event-description">Description</label><textarea id="event-description" name="description" rows={4} placeholder="Event description..." style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="event-speakers">Speakers (comma-separated)</label><input id="event-speakers" name="speakers" placeholder="Dr. Smith, Prof. Lee" /></div>
                        <div className="form-group"><label htmlFor="event-organizer">Organizer</label><input id="event-organizer" name="organizer" defaultValue="NADI" /></div>
                    </div>
                    <div className="form-group"><label htmlFor="event-registration-url">Registration URL</label><input id="event-registration-url" name="registrationUrl" placeholder="https://..." /></div>
                </div>

                <div className="editor-section">
                    <div className="editor-section-title">Cover Image</div>
                    <input id="event-image" type="file" name="image" accept="image/*" onChange={handleImageChange} aria-label="Cover image upload" />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{ marginTop: "1rem", maxWidth: "100%", maxHeight: "300px", borderRadius: "6px", border: "1px solid var(--line)" }} />}
                </div>

                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Create Event"}</button>
                    <a href="/admin/events" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
