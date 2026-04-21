"use client";

import { useState, useEffect, use } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface EventItem {
    slug: string; title: string; description: string;
    date: string; time: string; location: string; locationType: string;
    category: string; status: string; speakers: string[]; imageUrl: string;
    organizer: string; registrationUrl: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [event, setEvent] = useState<EventItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/public/events?slug=${slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.error) setError(data.error);
                else setEvent(data.event);
            })
            .catch(() => setError("Failed to load event."))
            .finally(() => setLoading(false));
    }, [slug]);

    return (
        <V2PageLayout title={event?.title || "Event"} eyebrow="Event Detail">
            <div style={{ maxWidth: 860, margin: "0 auto" }}>
                <p style={{ marginBottom: "1.5rem" }}>
                    <a href="/events" style={{ color: "#666", textDecoration: "none" }}>← Back to Events</a>
                </p>

                {loading ? (
                    <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading...</p>
                ) : error ? (
                    <p style={{ textAlign: "center", padding: "3rem 0", color: "#c00" }}>{error}</p>
                ) : event ? (
                    <>
                        {event.imageUrl && (
                            <div style={{ width: "100%", marginBottom: "1.5rem", borderRadius: 6, overflow: "hidden", background: "#f3f3f3" }}>
                                <img src={event.imageUrl} alt={event.title} style={{ width: "100%", height: "auto", display: "block" }} />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                            <span className="v2-card-meta">{event.category}</span>
                            <span className="v2-card-badge">{event.status}</span>
                        </div>

                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.95rem", color: "#444" }}>
                            <div>📅 <strong>{event.date}</strong>{event.time && ` · ${event.time}`}</div>
                            <div>📍 {event.location || "TBA"} · {event.locationType}</div>
                            {event.speakers.length > 0 && <div>🎤 {event.speakers.join(", ")}</div>}
                            {event.organizer && <div>🏛 Organized by {event.organizer}</div>}
                        </div>

                        {event.description && (
                            <div style={{ lineHeight: 1.7, fontSize: "1rem", color: "#222", whiteSpace: "pre-wrap", marginBottom: "2rem" }}>
                                {event.description}
                            </div>
                        )}

                        {event.registrationUrl && (
                            <p>
                                <a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="v2-nav-cta" style={{ display: "inline-block" }}>
                                    Register / Learn More →
                                </a>
                            </p>
                        )}
                    </>
                ) : null}
            </div>
        </V2PageLayout>
    );
}
