import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({ params }: Props) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    const { slug } = await params;

    return (
        <div className="admin-content admin-content--wide">
            <ArticleEditor slug={slug} />
        </div>
    );
}
