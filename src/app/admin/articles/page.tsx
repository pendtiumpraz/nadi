import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleListClient from "@/components/ArticleList";
import { getAllArticlesStore, getArticlesByAuthor } from "@/lib/articles-store";
import { asRole, canPublish } from "@/lib/permissions";

export default async function AdminArticlesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Authors (contributor / partner) only see their own articles; admin and
    // reviewer see every article so they can moderate / publish.
    const role = asRole(session.user.role);
    const isAuthor = !canPublish(session.user);
    const isPartner = role === "partner";

    const articles = isAuthor
        ? await getArticlesByAuthor(session.user.id)
        : await getAllArticlesStore();

    const title = isAuthor ? "My Submissions" : "Articles";
    const desc = isAuthor
        ? "Track the status of your submissions — drafts, in review, and published."
        : "Create, edit, and manage publications.";
    const newCta = isPartner ? "+ New Submission" : isAuthor ? "+ New Article" : "+ New Article";

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">{title}</h1>
                    <p className="admin-page-desc">{desc}</p>
                </div>
                <a href="/admin/articles/new" className="btn-primary">{newCta}</a>
            </div>
            <ArticleListClient initialArticles={articles} partnerView={isAuthor} />
        </div>
    );
}
