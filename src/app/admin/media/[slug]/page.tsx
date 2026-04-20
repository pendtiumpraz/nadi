"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";

interface Props {
    params: Promise<{ slug: string }>;
}

export default function EditMediaPage({ params }: Props) {
    const { slug } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("video");
    const [embedUrl, setEmbedUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [date, setDate] = useState("");
    const [duration, setDuration] = useState("");
    const [speakers, setSpeakers] = useState("");
    const [category, setCategory] = useState("Health Policy");

    const normalizeEmbed = (url: string): string => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        return url;
    };

    useEffect(() => {
        fetch(`/api/media?slug=${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setStatus(`Error: ${data.error}`); return; }
                setTitle(data.title || "");
                setDescription(data.description || "");
                setType(data.type || "video");
                setEmbedUrl(data.embedUrl || "");
                setThumbnailUrl(data.thumbnailUrl || "");
                setDate(data.date ? data.date.split("T")[0] : "");
                setDuration(data.duration || "");
                setSpeakers((data.speakers || []).join(", "));
                setCategory(data.category || "Health Policy");
            })
            .catch(() => setStatus("Failed to load media."))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setStatus("Saving...");
        try {
            const body = {
                slug,
                title,
                description,
                type,
                embedUrl: normalizeEmbed(embedUrl),
                thumbnailUrl,
                date,
                duration,
                speakers: speakers.split(",").map(s => s.trim()).filter(Boolean),
                category,
            };
            const res = await fetch("/api/media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("✓ Media updated!");
            setTimeout(() => router.push("/admin/media"), 1000);
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    if (loading) return <div className="admin-body"><p className="admin-page-desc">Loading...</p></div>;

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Edit Media</h1>
            <p className="admin-page-desc">Update this video, podcast, or webinar.</p>
            <form onSubmit={handleSubmit} className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Media Details</div>
                    <div className="form-group"><label>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} required /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Type</label>
                            <select value={type} onChange={e => setType(e.target.value)}>
                                <option value="video">🎬 Video</option><option value="podcast">🎙️ Podcast</option><option value="webinar">💻 Webinar</option><option value="interview">🎤 Interview</option><option value="panel">👥 Panel Discussion</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Category</label><input value={category} onChange={e => setCategory(e.target.value)} /></div>
                    </div>
                    <div className="form-group">
                        <label>YouTube / Embed URL *</label>
                        <input value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} required placeholder="https://youtube.com/watch?v=... or embed URL" />
                        <span className="editor-hint">Paste a YouTube watch URL — it will auto-convert to embed format.</span>
                    </div>
                    {embedUrl && (
                        <div style={{ marginTop: "0.5rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--line)", aspectRatio: "16/9", maxWidth: "500px" }}>
                            <iframe src={normalizeEmbed(embedUrl)} width="100%" height="100%" style={{ border: "none" }} allowFullScreen title="Preview" />
                        </div>
                    )}
                    <div className="editor-grid">
                        <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="form-group"><label>Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 45 min" /></div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="form-group"><label>Speakers (comma-separated)</label><input value={speakers} onChange={e => setSpeakers(e.target.value)} placeholder="Dr. Smith, Prof. Lee" /></div>
                    <div className="form-group"><label>Custom Thumbnail URL (optional)</label><input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." /></div>
                </div>

                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Update Media"}</button>
                    <a href="/admin/media" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
