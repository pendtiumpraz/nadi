import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleListClient from "@/components/ArticleList";
import { getAllArticlesStore, getArticlesByAuthor } from "@/lib/articles-store";
import { asRole } from "@/lib/permissions";

export default async function AdminArticlesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isPartner = asRole(session.user.role) === "partner";
    const articles = isPartner
        ? await getArticlesByAuthor(session.user.id)
        : await getAllArticlesStore();

    const title = isPartner ? "My Submissions" : "Articles";
    const desc = isPartner
        ? "Track the status of your policy product submissions."
        : "Create, edit, and manage publications.";
    const newCta = isPartner ? "+ New Submission" : "+ New Article";

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">{title}</h1>
                    <p className="admin-page-desc">{desc}</p>
                </div>
                <a href="/admin/articles/new" className="btn-primary">{newCta}</a>
            </div>
            <ArticleListClient initialArticles={articles} partnerView={isPartner} />
        </div>
    );
}
