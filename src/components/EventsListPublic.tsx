"use client";

import { useState, useEffect } from "react";

interface Event {
    slug: string; title: string; description: string; date: string;
    time: string; location: string; locationType: string; category: string;
    imageUrl: string; status: string; speakers: string[]; organizer: string;
}

export default function EventsListPublic() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/events")
            .then((r) => r.json())
            .then((d) => setEvents(d.events || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>Loading events...</div>;
    if (events.length === 0) return <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--muted)" }}>No events scheduled yet. Check back soon!</div>;

    const statusColor: Record<string, string> = { upcoming: "#2a7d2a", ongoing: "#b8860b", completed: "#666" };

    return (
        <div className="events-public-grid">
            {events.map((e) => (
                <div key={e.slug} className="event-card">
                    {e.imageUrl && (
                        <div className="event-card-img">
                            <img src={e.imageUrl} alt={e.title} />
                        </div>
                    )}
                    <div className="event-card-body">
                        <div className="event-card-top">
                            <span className="event-card-cat">{e.category}</span>
                            <span className="event-card-status" style={{ color: statusColor[e.status] || "#666" }}>{e.status}</span>
                        </div>
                        <h3 className="event-card-title">{e.title}</h3>
                        <p className="event-card-desc">{e.description}</p>
                        <div className="event-card-meta">
                            <span>📅 {new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                            {e.time && <span>🕐 {e.time}</span>}
                        </div>
                        <div className="event-card-meta">
                            <span>📍 {e.location || "TBA"}</span>
                            <span className="event-card-type">{e.locationType}</span>
                        </div>
                        {e.speakers && e.speakers.length > 0 && (
                            <p className="event-card-speakers">🎤 {e.speakers.join(", ")}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
