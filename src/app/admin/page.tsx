import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllArticlesAsync } from "@/data/articles";
import { getArticlesByAuthor } from "@/lib/articles-store";
import { getSubscriberCount } from "@/lib/newsletter-store";
import { asRole } from "@/lib/permissions";

export default async function AdminDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Authors (contributor / partner) see numbers scoped to themselves — total
    // articles is just THEIR submissions, "Published" is the count of those
    // already live. Admin/reviewer see the platform-wide totals like before.
    const role = asRole(session.user.role);
    const isAuthor = role === "contributor" || role === "partner";

    const allArticles = isAuthor
        ? await getArticlesByAuthor(session.user.id)
        : await getAllArticlesAsync();
    const publishedArticles = allArticles.filter((a) => (a.status ?? "published") === "published");
    const publishedCount = publishedArticles.length;
    const latestArticle = isAuthor ? allArticles[0] : publishedArticles[0];
    const { active } = await getSubscriberCount();

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
                    <span className="admin-stat-value">{publishedCount}</span>
                    <span className="admin-stat-label">
                        {isAuthor ? "My Published Articles" : "Published Articles"}
                    </span>
                </div>
                {isAuthor ? (
                    <div className="admin-stat-card">
                        <span className="admin-stat-value">{allArticles.length}</span>
                        <span className="admin-stat-label">My Total Submissions</span>
                    </div>
                ) : (
                    <div className="admin-stat-card">
                        <span className="admin-stat-value">{active || 0}</span>
                        <span className="admin-stat-label">Active Subscribers</span>
                    </div>
                )}
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{session.user.role === "admin" ? "Full" : isAuthor ? "Author" : "Review"}</span>
                    <span className="admin-stat-label">Access Level</span>
                </div>
            </div>

            <h2 className="admin-section-title">Quick Actions</h2>
            <div className="admin-cards">
                <a href="/admin/articles/new" className="admin-card">
                    <span className="admin-card-icon">✏️</span>
                    <span className="admin-card-title">Write New Article</span>
                    <span className="admin-card-desc">Create a publication with magazine-style layout blocks.</span>
                </a>
                <a href="/policy-guideline" className="admin-card" target="_blank" rel="noopener noreferrer">
                    <span className="admin-card-icon">📘</span>
                    <span className="admin-card-title">Policy Product Guideline</span>
                    <span className="admin-card-desc">Download the canonical NADI guideline before writing your policy product.</span>
                </a>
                <a href="/admin/newsletter" className="admin-card">
                    <span className="admin-card-icon">✉️</span>
                    <span className="admin-card-title">Subscribers List</span>
                    <span className="admin-card-desc">Manage newsletter users, activate, and export to CSV.</span>
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
                    <h2 className="admin-section-title" style={{ marginTop: "2rem" }}>
                        {isAuthor ? "Your Latest Submission" : "Latest Publication"}
                    </h2>
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
