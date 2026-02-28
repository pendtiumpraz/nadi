import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllArticles } from "@/data/articles";

export default async function AdminDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const articles = getAllArticles();
    const totalArticles = articles.length;
    const latestArticle = articles[0];

    return (
        <div className="admin-content">
            <div className="admin-welcome">
                <div className="admin-welcome-text">
                    <span className="admin-welcome-label">Welcome back,</span>
                    <h1 className="admin-welcome-name">{session.user.name}</h1>
                </div>
                <div className="admin-welcome-meta">
                    <span className="admin-welcome-role">{session.user.role}</span>
                    <span className="admin-welcome-email">{session.user.email}</span>
                </div>
            </div>

            <div className="admin-stats">
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{totalArticles}</span>
                    <span className="admin-stat-label">Published Articles</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{session.user.role === "admin" ? "Full" : "Write"}</span>
                    <span className="admin-stat-label">Access Level</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{latestArticle ? new Date(latestArticle.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
                    <span className="admin-stat-label">Last Published</span>
                </div>
            </div>

            <h2 className="admin-section-title">Quick Actions</h2>
            <div className="admin-cards">
                <a href="/admin/articles/new" className="admin-card">
                    <span className="admin-card-icon">✏️</span>
                    <span className="admin-card-title">Write New Article</span>
                    <span className="admin-card-desc">Create a publication with magazine-style layout blocks.</span>
                </a>
                <a href="/admin/articles" className="admin-card">
                    <span className="admin-card-icon">📄</span>
                    <span className="admin-card-title">Manage Articles</span>
                    <span className="admin-card-desc">Edit, delete, or review all existing publications.</span>
                </a>
                {session.user.role === "admin" && (
                    <a href="/admin/users" className="admin-card">
                        <span className="admin-card-icon">👥</span>
                        <span className="admin-card-title">User Management</span>
                        <span className="admin-card-desc">Add users, change roles, and manage access.</span>
                    </a>
                )}
                <a href="/publications" className="admin-card" target="_blank">
                    <span className="admin-card-icon">🌐</span>
                    <span className="admin-card-title">View Website</span>
                    <span className="admin-card-desc">See your publications live on the public site.</span>
                </a>
            </div>

            {latestArticle && (
                <>
                    <h2 className="admin-section-title" style={{ marginTop: "2rem" }}>Latest Publication</h2>
                    <a href={`/admin/articles/${latestArticle.slug}`} className="admin-latest">
                        <div className="admin-latest-badge">{latestArticle.category}</div>
                        <h3 className="admin-latest-title">{latestArticle.title}</h3>
                        <p className="admin-latest-meta">{latestArticle.author} · {latestArticle.readTime} · {new Date(latestArticle.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </a>
                </>
            )}
        </div>
    );
}
