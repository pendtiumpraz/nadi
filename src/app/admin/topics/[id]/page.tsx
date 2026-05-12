import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getTopicById } from "@/lib/topics-store";
import { asRole } from "@/lib/permissions";
import TopicChat from "@/components/TopicChat";

interface Props {
    params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminTopicDetailPage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (asRole(session.user.role) === "partner") redirect("/admin");

    const { id } = await params;
    const topicId = Number(id);
    if (!Number.isFinite(topicId) || topicId <= 0) notFound();

    const topic = await getTopicById(topicId);
    if (!topic) notFound();

    return (
        <div className="admin-content">
            <div style={{ marginBottom: "1.25rem" }}>
                <a href="/admin/topics" style={{ fontSize: "0.85rem", color: "var(--muted)", textDecoration: "none" }}>
                    ← Back to Topics
                </a>
            </div>

            <h1 className="admin-page-title">{topic.title}</h1>
            <p className="admin-page-desc">{topic.description || "No description provided."}</p>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                }}
            >
                {topic.category && <span><strong>Category:</strong> {topic.category}</span>}
                {topic.focusArea && <span><strong>Focus:</strong> {topic.focusArea}</span>}
                <span><strong>Status:</strong> {topic.status}</span>
                {topic.articleSlug && (
                    <span>
                        <strong>Article:</strong>{" "}
                        <a href={`/admin/articles/${topic.articleSlug}`}>{topic.articleSlug}</a>
                    </span>
                )}
                <span>
                    <strong>Created:</strong> {new Date(topic.createdAt).toLocaleString()}
                </span>
            </div>

            <TopicChat topicId={topic.id} />
        </div>
    );
}
