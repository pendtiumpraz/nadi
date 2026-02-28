import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";

export default async function NewArticlePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="admin-content admin-content--wide">
            <h1 className="admin-page-title">New Article</h1>
            <p className="admin-page-desc">Create a new publication with magazine-style blocks.</p>
            <ArticleEditor />
        </div>
    );
}
