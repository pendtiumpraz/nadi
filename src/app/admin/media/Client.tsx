"use client";

import { useState, useEffect } from "react";
import { confirmDialog, useToast } from "@/components/Toast";

interface Media {
    slug: string; title: string; type: string; date: string;
    embedUrl: string; duration: string; category: string;
}

export default function MediaPage() {
    const [items, setItems] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetch("/api/media").then(r => r.json()).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleDelete = async (slug: string) => {
        const ok = await confirmDialog({
            title: "Delete media?",
            message: "This will permanently remove the media item.",
            confirmText: "Delete",
            tone: "danger",
        });
        if (!ok) return;
        const res = await fetch(`/api/media?slug=${slug}`, { method: "DELETE" });
        if (res.ok) {
            setItems(items.filter(m => m.slug !== slug));
            toast.success("Media deleted.");
        } else {
            toast.error("Failed to delete media.");
        }
    };

    const typeEmoji: Record<string, string> = { video: "🎬", podcast: "🎙️", webinar: "💻", interview: "🎤", panel: "👥" };

    return (
        <div className="admin-body">
            <div className="admin-content-header">
                <h1 className="admin-page-title">Media</h1>
                <a href="/admin/media/new" className="btn-primary">+ New Media</a>
            </div>
            {loading ? <p className="admin-page-desc">Loading...</p> : items.length === 0 ? (
                <div className="admin-empty">No media yet. Add your first video or podcast!</div>
            ) : (
                <table className="admin-table">
                    <thead><tr><th>Media</th><th>Type</th><th>Date</th><th>Duration</th><th>Actions</th></tr></thead>
                    <tbody>
                        {items.map(m => (
                            <tr key={m.slug}>
                                <td><strong>{m.title}</strong><br /><span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{m.category}</span></td>
                                <td>{typeEmoji[m.type] || "📺"} {m.type}</td>
                                <td>{new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                <td>{m.duration || "—"}</td>
                                <td>
                                    <div className="admin-actions">
                                        <a href={`/admin/media/${m.slug}`} className="admin-btn">Edit</a>
                                        <button onClick={() => handleDelete(m.slug)} className="admin-btn admin-btn--danger">Del</button>
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
