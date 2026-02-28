import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleListClient from "@/components/ArticleList";

export default async function AdminArticlesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">Articles</h1>
                    <p className="admin-page-desc">Create, edit, and manage publications.</p>
                </div>
                <a href="/admin/articles/new" className="btn-primary">+ New Article</a>
            </div>
            <ArticleListClient />
        </div>
    );
}
