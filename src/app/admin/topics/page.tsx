import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllTopics } from "@/lib/topics-store";
import { asRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (asRole(session.user.role) === "partner") redirect("/admin");

    const topics = await getAllTopics();

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">Topics</h1>
                    <p className="admin-page-desc">
                        Curated research topic ideas. Discuss each with the team before turning it into an article assignment.
                    </p>
                </div>
                <a href="/admin/ai" className="btn-primary">+ Generate Topics</a>
            </div>

            {topics.length === 0 ? (
                <p className="admin-page-desc" style={{ marginTop: "2rem" }}>
                    No topics yet. Use the AI Writer to generate some ideas.
                </p>
            ) : (
                <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
                    <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                                <th style={{ padding: "0.75rem 0.5rem" }}>Title</th>
                                <th style={{ padding: "0.75rem 0.5rem" }}>Category</th>
                                <th style={{ padding: "0.75rem 0.5rem" }}>Focus</th>
                                <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                                <th style={{ padding: "0.75rem 0.5rem" }}>Created</th>
                                <th style={{ padding: "0.75rem 0.5rem" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {topics.map((t) => (
                                <tr key={t.id} style={{ borderBottom: "1px solid var(--line)" }}>
                                    <td style={{ padding: "0.65rem 0.5rem", fontWeight: 600 }}>
                                        <a href={`/admin/topics/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                            {t.title}
                                        </a>
                                    </td>
                                    <td style={{ padding: "0.65rem 0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t.category}</td>
                                    <td style={{ padding: "0.65rem 0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>{t.focusArea}</td>
                                    <td style={{ padding: "0.65rem 0.5rem", fontSize: "0.85rem" }}>{t.status}</td>
                                    <td style={{ padding: "0.65rem 0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "0.65rem 0.5rem", textAlign: "right" }}>
                                        <a href={`/admin/topics/${t.id}`} className="btn-outline" style={{ fontSize: "0.8rem" }}>
                                            Open discussion
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
