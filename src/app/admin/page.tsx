import { auth } from "@/lib/auth";

export default async function AdminDashboard() {
    const session = await auth();

    return (
        <div className="admin-content">
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-desc">
                Welcome back, {session?.user?.name}. You are logged in as{" "}
                <strong>{session?.user?.role}</strong>.
            </p>
            <div className="admin-cards">
                <a href="/admin/users" className="admin-card">
                    <span className="admin-card-icon">👥</span>
                    <span className="admin-card-title">User Management</span>
                    <span className="admin-card-desc">Add, edit, and manage users</span>
                </a>
                <a href="/publications" className="admin-card">
                    <span className="admin-card-icon">📄</span>
                    <span className="admin-card-title">Publications</span>
                    <span className="admin-card-desc">View published articles</span>
                </a>
                <a href="/" className="admin-card">
                    <span className="admin-card-icon">🌐</span>
                    <span className="admin-card-title">View Site</span>
                    <span className="admin-card-desc">Open the public website</span>
                </a>
            </div>
        </div>
    );
}
