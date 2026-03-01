"use client";

import { useState, useEffect } from "react";

interface MediaItem {
    slug: string; title: string; description: string; type: string;
    embedUrl: string; thumbnailUrl: string; date: string;
    duration: string; speakers: string[]; category: string;
}

const typeEmoji: Record<string, string> = { video: "🎬", podcast: "🎙️", webinar: "💻", interview: "🎤", panel: "👥" };

export default function MediaListPublic() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/public/media")
            .then((r) => r.json())
            .then((d) => setItems(d.media || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>Loading media...</div>;
    if (items.length === 0) return <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>No media content yet. Check back soon!</div>;

    return (
        <div className="media-public-grid">
            {items.map((m) => (
                <div key={m.slug} className="media-card">
                    <div className="media-card-player" onClick={() => setPlaying(playing === m.slug ? null : m.slug)}>
                        {playing === m.slug ? (
                            <iframe src={m.embedUrl} width="100%" height="100%" style={{ border: "none" }} allowFullScreen title={m.title} />
                        ) : (
                            <div className="media-card-thumb">
                                {m.thumbnailUrl ? (
                                    <img src={m.thumbnailUrl} alt={m.title} />
                                ) : m.embedUrl.includes("youtube") ? (
                                    <img src={`https://img.youtube.com/vi/${m.embedUrl.split("/embed/")[1]?.split("?")[0]}/hqdefault.jpg`} alt={m.title} />
                                ) : (
                                    <div className="media-card-thumb-placeholder">{typeEmoji[m.type] || "📺"}</div>
                                )}
                                <div className="media-card-play">▶</div>
                            </div>
                        )}
                    </div>
                    <div className="media-card-body">
                        <div className="media-card-top">
                            <span className="media-card-type">{typeEmoji[m.type] || "📺"} {m.type}</span>
                            {m.duration && <span className="media-card-duration">{m.duration}</span>}
                        </div>
                        <h3 className="media-card-title">{m.title}</h3>
                        <p className="media-card-desc">{m.description}</p>
                        <div className="media-card-meta">
                            <span>{new Date(m.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                            <span>{m.category}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
