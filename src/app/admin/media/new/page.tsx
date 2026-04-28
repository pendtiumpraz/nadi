"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewMediaPage() {
    const router = useRouter();
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [embedUrl, setEmbedUrl] = useState("");

    // Auto-convert watch URLs (YouTube / TikTok / Instagram) to embed URLs
    const normalizeEmbed = (url: string): string => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
        const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
        if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`;
        return url;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setStatus("Saving...");
        try {
            const fd = new FormData(e.currentTarget);
            const body = {
                title: fd.get("title"),
                description: fd.get("description"),
                type: fd.get("type"),
                embedUrl: normalizeEmbed(fd.get("embedUrl") as string),
                thumbnailUrl: fd.get("thumbnailUrl"),
                date: fd.get("date"),
                duration: fd.get("duration"),
                speakers: ((fd.get("speakers") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
                category: fd.get("category"),
                keywords: ((fd.get("keywords") as string) || "").split(",").map(s => s.trim()).filter(Boolean),
            };
            const res = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus("✓ Media added!");
            setTimeout(() => router.push("/admin/media"), 1000);
        } catch (err) {
            setStatus(`Error: ${(err as Error).message}`);
        }
        setSaving(false);
    };

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Add Media</h1>
            <p className="admin-page-desc">Add a video, podcast, webinar, or interview. Paste the embed or watch URL.</p>
            <form onSubmit={handleSubmit} className="editor">
                <div className="editor-section">
                    <div className="editor-section-title">Media Details</div>
                    <div className="form-group"><label>Title *</label><input name="title" required placeholder="e.g. NADI Policy Forum Keynote 2026" /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label>Type</label>
                            <select name="type">
                                <option value="video">🎬 Video</option>
                                <option value="podcast">🎙️ Podcast</option>
                                <option value="webinar">💻 Webinar</option>
                                <option value="interview">🎤 Interview</option>
                                <option value="panel">👥 Panel Discussion</option>
                                <option value="tiktok">🎵 TikTok</option>
                                <option value="instagram">📷 Instagram</option>
                                <option value="reel">📱 Reel</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Category</label><input name="category" defaultValue="Health Policy" placeholder="e.g. Health Policy, UHC" /></div>
                    </div>
                    <div className="form-group">
                        <label>YouTube / TikTok / Instagram / Embed URL *</label>
                        <input name="embedUrl" required placeholder="https://youtube.com/... or tiktok.com/... or instagram.com/p/..." value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} />
                        <span className="editor-hint">Paste a YouTube, TikTok, or Instagram URL — auto-converts to embed format.</span>
                    </div>
                    {embedUrl && (
                        <div style={{ marginTop: "0.5rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--line)", aspectRatio: "16/9", maxWidth: "500px" }}>
                            <iframe src={normalizeEmbed(embedUrl)} width="100%" height="100%" style={{ border: "none" }} allowFullScreen title="Preview" />
                        </div>
                    )}
                    <div className="editor-grid">
                        <div className="form-group"><label>Date</label><input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
                        <div className="form-group"><label>Duration</label><input name="duration" placeholder="e.g. 45 min" /></div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea name="description" rows={3} placeholder="Brief description..." style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="form-group"><label>Speakers (comma-separated)</label><input name="speakers" placeholder="Dr. Smith, Prof. Lee" /></div>
                    <div className="form-group"><label>Keywords (comma-separated)</label><input name="keywords" placeholder="universal coverage, vaccine equity, financing" /><span className="editor-hint">Used for search & SEO.</span></div>
                    <div className="form-group"><label>Custom Thumbnail URL (optional)</label><input name="thumbnailUrl" placeholder="https://..." /></div>
                </div>

                {status && <div className="admin-msg" onClick={() => setStatus("")}>{status}</div>}
                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Add Media"}</button>
                    <a href="/admin/media" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
