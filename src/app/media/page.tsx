"use client";

import { useState, useEffect } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface MediaItem {
    id: number; slug: string; title: string; description: string;
    type: string; embedUrl: string; thumbnailUrl: string;
    date: string; duration: string; category: string;
}

function getYouTubeThumb(url: string) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=))([^&?]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : "";
}

export default function MediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/media")
            .then((r) => r.json())
            .then((data) => setItems(data.media || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <V2PageLayout title="Media & <em>Resources</em>" eyebrow="Videos & Press">
            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading media...</p>
            ) : items.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>No media content yet.</p>
            ) : (
                <div className="v2-card-grid">
                    {items.map((m) => {
                        const thumb = m.thumbnailUrl || getYouTubeThumb(m.embedUrl);
                        return (
                            <a href={m.embedUrl} target="_blank" rel="noopener noreferrer" className="v2-card" key={m.id}>
                                {thumb && (
                                    <div style={{ position: "relative", borderRadius: 2, overflow: "hidden", marginBottom: "0.5rem" }}>
                                        <img src={thumb} alt={m.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}>
                                            <span style={{ fontSize: "2rem", color: "#fff" }}>▶</span>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="v2-card-meta">{m.category}</span>
                                    <span className="v2-card-badge">{m.type}</span>
                                </div>
                                <h3>{m.title}</h3>
                                <p>{m.description}</p>
                                <div className="v2-card-date">{m.date} {m.duration && `· ${m.duration}`}</div>
                            </a>
                        );
                    })}
                </div>
            )}
        </V2PageLayout>
    );
}
