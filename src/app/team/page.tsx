"use client";

import { useState, useEffect } from "react";
import V2PageLayout from "@/components/V2PageLayout";
import "@/app/landing-v2.css";

interface Member {
    id: number; name: string; title: string; bio: string;
    initials: string; photoUrl: string; linkedinUrl: string; isFeatured: boolean;
}

interface Pagination { page: number; totalPages: number; total: number; }

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/public/team?page=${page}&limit=12`)
            .then((r) => r.json())
            .then((data) => { setMembers(data.members || []); setPagination(data.pagination || null); })
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <V2PageLayout title="Our <em>Team</em>" eyebrow="Leadership & Experts">
            {loading ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Loading team...</p>
            ) : members.length === 0 ? (
                <p style={{ textAlign: "center", padding: "3rem 0", color: "#888" }}>Team directory coming soon.</p>
            ) : (
                <>
                    <div className="v2-team-grid">
                        {members.map((m) => (
                            <div className="v2-team-card" key={m.id}>
                                <div className="v2-team-avatar">
                                    {m.photoUrl ? (
                                        <img src={m.photoUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                    ) : (
                                        <span>{m.initials || m.name[0]}</span>
                                    )}
                                </div>
                                <div className="v2-team-info">
                                    <h4>{m.name}</h4>
                                    <p className="v2-team-title">{m.title}</p>
                                    <p className="v2-team-bio">{m.bio}</p>
                                    <a href={m.linkedinUrl || "#"} target={m.linkedinUrl ? "_blank" : undefined} rel="noopener noreferrer" className="v2-link-more" style={{ marginTop: "0.5rem", fontSize: "0.7rem" }}>
                                        in LinkedIn →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="v2-pagination">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}
        </V2PageLayout>
    );
}
