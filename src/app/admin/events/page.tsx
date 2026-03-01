"use client";

import { useState, useEffect } from "react";

interface Event {
    slug: string; title: string; date: string; location: string;
    locationType: string; category: string; status: string; imageUrl: string;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/events").then(r => r.json()).then(d => { setEvents(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleDelete = async (slug: string) => {
        if (!confirm("Delete this event?")) return;
        await fetch(`/api/events?slug=${slug}`, { method: "DELETE" });
        setEvents(events.filter(e => e.slug !== slug));
    };

    return (
        <div className="admin-body">
            <div className="admin-content-header">
                <h1 className="admin-page-title">Events</h1>
                <a href="/admin/events/new" className="btn-primary">+ New Event</a>
            </div>
            {loading ? <p className="admin-page-desc">Loading...</p> : events.length === 0 ? (
                <div className="admin-empty">No events yet. Create your first event!</div>
            ) : (
                <table className="admin-table">
                    <thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {events.map(e => (
                            <tr key={e.slug}>
                                <td><strong>{e.title}</strong><br /><span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{e.category}</span></td>
                                <td>{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                <td>{e.location}<br /><span className={`role-badge role-badge--${e.locationType === "online" ? "user" : "admin"}`}>{e.locationType}</span></td>
                                <td><span className={`role-badge role-badge--${e.status === "upcoming" ? "admin" : "user"}`}>{e.status}</span></td>
                                <td>
                                    <div className="admin-actions">
                                        <a href={`/admin/events/${e.slug}`} className="admin-btn">Edit</a>
                                        <button onClick={() => handleDelete(e.slug)} className="admin-btn admin-btn--danger">Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
