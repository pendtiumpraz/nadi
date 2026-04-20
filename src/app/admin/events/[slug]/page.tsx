"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

interface Props {
    params: Promise<{ slug: string }>;
}

export default function EditEventPage({ params }: Props) {
    const { slug } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [locationType, setLocationType] = useState("onsite");
    const [category, setCategory] = useState("conference");
    const [eventStatus, setEventStatus] = useState("upcoming");
    const [speakers, setSpeakers] = useState("");
    const [organizer, setOrganizer] = useState("NADI");
    const [registrationUrl, setRegistrationUrl] = useState("");

    useEffect(() => {
        fetch(`/api/events?slug=${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setStatus(`Error: ${data.error}`); return; }
                setTitle(data.title || "");
                setDescription(data.description || "");
                setDate(data.date ? data.date.split("T")[0] : "");
                setTime(data.time || "");
                setLocation(data.location || "");
                setLocationType(data.locationType || "onsite");
                setCategory(data.category || "conference");
                setEventStatus(data.status || "upcoming");
                setSpeakers((data.speakers || []).join(", "));
                setOrganizer(data.organizer || "NADI");
                setRegistrationUrl(data.registrationUrl || "");
                setCurrentImageUrl(data.imageUrl || "");
            })
            .catch(() => setStatus("Failed to load event."))
            .finally(() => setLoading(false));
    }, [slug]);

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
            form.set("slug", slug);
            const res = await fetch("/api/events", { method: "PUT", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("✓ Event updated!");
            setTimeout(() => router.push("/admin/events"), 1000);
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    if (loading) return <div className="admin-body"><p className="admin-page-desc">Loading...</p></div>;

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Edit Event</h1>
            <p className="admin-page-desc">Update event details and cover image.</p>
            <form onSubmit={handleSubmit} className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Event Details</div>
                    <div className="form-group"><label>Title *</label><input name="title" required value={title} onChange={e => setTitle(e.target.value)} /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Date *</label><input name="date" type="date" required value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="form-group"><label>Time</label><input name="time" value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 09:00 - 17:00 WIB" /></div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Location</label><input name="location" value={location} onChange={e => setLocation(e.target.value)} /></div>
                        <div className="form-group"><label>Location Type</label>
                            <select name="locationType" value={locationType} onChange={e => setLocationType(e.target.value)}>
                                <option value="onsite">Onsite</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Category</label>
                            <select name="category" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="conference">Conference</option><option value="seminar">Seminar</option><option value="workshop">Workshop</option><option value="roundtable">Roundtable</option><option value="launch">Launch</option><option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Status</label>
                            <select name="status" value={eventStatus} onChange={e => setEventStatus(e.target.value)}>
                                <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Speakers (comma-separated)</label><input name="speakers" value={speakers} onChange={e => setSpeakers(e.target.value)} placeholder="Dr. Smith, Prof. Lee" /></div>
                        <div className="form-group"><label>Organizer</label><input name="organizer" value={organizer} onChange={e => setOrganizer(e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label>Registration URL</label><input name="registrationUrl" value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)} placeholder="https://..." /></div>
                </div>

                <div className="editor-section">
                    <div className="editor-section-title">Cover Image</div>
                    {currentImageUrl && !imagePreview && (
                        <div style={{ marginBottom: "0.75rem" }}>
                            <img src={currentImageUrl} alt="Current cover" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "6px", border: "1px solid var(--line)" }} />
                            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>Current image — upload new file below to replace.</p>
                        </div>
                    )}
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{ marginTop: "1rem", maxWidth: "100%", maxHeight: "300px", borderRadius: "6px", border: "1px solid var(--line)" }} />}
                </div>

                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Update Event"}</button>
                    <a href="/admin/events" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
