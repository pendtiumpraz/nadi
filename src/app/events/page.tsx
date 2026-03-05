"use client";

import { useState, useEffect } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface EventItem {
    id: number; slug: string; title: string; description: string;
    date: string; time: string; location: string; locationType: string;
    category: string; status: string; speakers: string[];
}

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/public/events")
            .then((r) => r.json())
            .then((data) => setEvents(data.events || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <V2PageLayout title="Events & <em>Engagements</em>" eyebrow="Conferences & Seminars">
            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading events...</p>
            ) : events.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>No events scheduled at this time.</p>
            ) : (
                <div className="v2-card-grid">
                    {events.map((e) => (
                        <div className="v2-card" key={e.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className="v2-card-meta">{e.category}</span>
                                <span className="v2-card-badge">{e.status}</span>
                            </div>
                            <h3>{e.title}</h3>
                            <p>{e.description}</p>
                            <div className="v2-card-date">📅 {e.date} {e.time && `· ${e.time}`}</div>
                            <div className="v2-card-date">📍 {e.location || "TBA"} · {e.locationType}</div>
                            {e.speakers.length > 0 && (
                                <div className="v2-card-date">🎤 {e.speakers.join(", ")}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </V2PageLayout>
    );
}
