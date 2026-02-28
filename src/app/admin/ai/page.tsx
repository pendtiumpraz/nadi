import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIGenerator from "@/components/AIGenerator";

export default async function AIGeneratorPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="admin-content admin-content--wide">
            <h1 className="admin-page-title">AI Article Generator</h1>
            <p className="admin-page-desc">Generate topics and full articles using DeepSeek AI. Output is SEO-optimized JSON ready for magazine-style layout.</p>
            <AIGenerator />
        </div>
    );
}
