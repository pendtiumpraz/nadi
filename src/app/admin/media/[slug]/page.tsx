"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Props {
    params: Promise<{ slug: string }>;
}

export default function EditMediaPage({ params }: Props) {
    const { slug } = use(params);
    const router = useRouter();
    const toast = useToast();
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
    const [keywords, setKeywords] = useState("");

    const normalizeEmbed = (url: string): string => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
        const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
        if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`;
        return url;
    };

    useEffect(() => {
        fetch(`/api/media?slug=${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { toast.error(data.error); return; }
                setTitle(data.title || "");
                setDescription(data.description || "");
                setType(data.type || "video");
                setEmbedUrl(data.embedUrl || "");
                setThumbnailUrl(data.thumbnailUrl || "");
                setDate(data.date ? data.date.split("T")[0] : "");
                setDuration(data.duration || "");
                setSpeakers((data.speakers || []).join(", "));
                setCategory(data.category || "Health Policy");
                setKeywords((data.keywords || []).join(", "));
            })
            .catch(() => toast.error("Failed to load media."))
            .finally(() => setLoading(false));
    }, [slug, toast]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
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
                keywords: keywords.split(",").map(s => s.trim()).filter(Boolean),
            };
            const res = await fetch("/api/media", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Media updated.");
            setTimeout(() => router.push("/admin/media"), 600);
        } catch (err) {
            toast.error((err as Error).message);
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
                    <div className="form-group"><label htmlFor="media-title">Title *</label><input id="media-title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="media-type">Type</label>
                            <select id="media-type" value={type} onChange={e => setType(e.target.value)}>
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
                        <div className="form-group"><label htmlFor="media-category">Category</label><input id="media-category" value={category} onChange={e => setCategory(e.target.value)} /></div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="media-embed-url">YouTube / TikTok / Instagram / Embed URL *</label>
                        <input id="media-embed-url" value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} required placeholder="https://youtube.com/... or tiktok.com/... or instagram.com/p/..." />
                        <span className="editor-hint">Paste a YouTube, TikTok, or Instagram URL — auto-converts to embed format.</span>
                    </div>
                    {embedUrl && (
                        <div style={{ marginTop: "0.5rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--line)", aspectRatio: "16/9", maxWidth: "500px" }}>
                            <iframe src={normalizeEmbed(embedUrl)} width="100%" height="100%" style={{ border: "none" }} allowFullScreen title="Preview" />
                        </div>
                    )}
                    <div className="editor-grid">
                        <div className="form-group"><label htmlFor="media-date">Date</label><input id="media-date" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                        <div className="form-group"><label htmlFor="media-duration">Duration</label><input id="media-duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 45 min" /></div>
                    </div>
                    <div className="form-group"><label htmlFor="media-description">Description</label><textarea id="media-description" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "10px", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-body)", fontSize: "0.9rem", resize: "vertical" }} /></div>
                    <div className="form-group"><label htmlFor="media-speakers">Speakers (comma-separated)</label><input id="media-speakers" value={speakers} onChange={e => setSpeakers(e.target.value)} placeholder="Dr. Smith, Prof. Lee" /></div>
                    <div className="form-group"><label htmlFor="media-keywords">Keywords (comma-separated)</label><input id="media-keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="universal coverage, vaccine equity, financing" /><span className="editor-hint">Used for search & SEO.</span></div>
                    <div className="form-group"><label htmlFor="media-thumbnail">Custom Thumbnail URL (optional)</label><input id="media-thumbnail" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." /></div>
                </div>

                <div className="editor-save">
                    <button type="submit" className="btn-primary" disabled={saving}>{saving ? "⏳ Saving..." : "Update Media"}</button>
                    <a href="/admin/media" className="btn-outline">Cancel</a>
                </div>
            </form>
        </div>
    );
}
