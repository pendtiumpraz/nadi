"use client";

import { useState, useEffect } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface MediaItem {
    id: number; slug: string; title: string; description: string;
    type: string; embedUrl: string; thumbnailUrl: string;
    date: string; duration: string; category: string;
    keywords?: string[];
}

function getYouTubeId(url: string): string {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([\w-]+)/);
    return m ? m[1] : "";
}

function getYouTubeThumb(url: string) {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
}

function isTikTok(url: string): boolean {
    return /tiktok\.com/.test(url);
}

function isInstagram(url: string): boolean {
    return /instagram\.com/.test(url);
}

function toEmbedUrl(url: string): string {
    const id = getYouTubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    const tiktokMatch = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/)(\d+)/);
    if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
    if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`;
    return url;
}

export default function MediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState<MediaItem | null>(null);

    useEffect(() => {
        fetch("/api/public/media")
            .then((r) => r.json())
            .then((data) => setItems(data.media || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [active]);

    return (
        <V2PageLayout
            title="Media & <em>Learning Materials</em>"
            eyebrow="Videos, Podcasts & Reels"
            subtitle="If you want to share any videos, podcasts, reels, webinar talks, and other materials for knowledge sharing through NADI, feel free to contact us."
        >
            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading media...</p>
            ) : items.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>No media content yet.</p>
            ) : (
                <div className="v2-card-grid">
                    {items.map((m) => {
                        const thumb = m.thumbnailUrl || getYouTubeThumb(m.embedUrl);
                        const isEmbeddable = !!getYouTubeId(m.embedUrl) || isTikTok(m.embedUrl) || isInstagram(m.embedUrl);
                        const platformBadge = isTikTok(m.embedUrl) ? "🎵 TikTok" : isInstagram(m.embedUrl) ? "📷 Instagram" : null;
                        return (
                            <button
                                type="button"
                                onClick={() => isEmbeddable ? setActive(m) : window.open(m.embedUrl, "_blank")}
                                className="v2-card"
                                key={m.id}
                                style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit", color: "inherit", width: "100%" }}
                            >
                                {thumb ? (
                                    <div style={{ position: "relative", borderRadius: 2, overflow: "hidden", marginBottom: "0.5rem" }}>
                                        <img src={thumb} alt={m.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}>
                                            <span style={{ fontSize: "2rem", color: "#fff" }}>▶</span>
                                        </div>
                                    </div>
                                ) : platformBadge && (
                                    <div style={{ height: 160, marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f8f8f8, #ececec)", borderRadius: 2, fontSize: "1.3rem", color: "#666" }}>
                                        {platformBadge}
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="v2-card-meta">{m.category}</span>
                                    <span className="v2-card-badge">{m.type}</span>
                                </div>
                                <h3>{m.title}</h3>
                                <p>{m.description}</p>
                                <div className="v2-card-date">{m.date} {m.duration && `· ${m.duration}`}</div>
                            </button>
                        );
                    })}
                </div>
            )}

            {active && (() => {
                const vertical = isTikTok(active.embedUrl) || isInstagram(active.embedUrl);
                return (
                <div
                    onClick={() => setActive(null)}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: vertical ? "420px" : "960px" }}>
                        <button
                            type="button"
                            onClick={() => setActive(null)}
                            aria-label="Close"
                            style={{ position: "absolute", top: -40, right: 0, background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}
                        >✕</button>
                        <div style={{ aspectRatio: vertical ? "9/16" : "16/9", background: "#000" }}>
                            <iframe
                                src={toEmbedUrl(active.embedUrl)}
                                width="100%"
                                height="100%"
                                style={{ border: "none", display: "block" }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={active.title}
                            />
                        </div>
                        <div style={{ color: "#fff", padding: "0.75rem 0" }}>
                            <h3 style={{ margin: 0 }}>{active.title}</h3>
                            {active.description && <p style={{ margin: "0.25rem 0 0", color: "#bbb", fontSize: "0.9rem" }}>{active.description}</p>}
                        </div>
                    </div>
                </div>
                );
            })()}
        </V2PageLayout>
    );
}
