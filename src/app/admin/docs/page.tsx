import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DocsClient from "./DocsClient";

export default async function AdminDocsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return <DocsClient isAdmin={session.user.role === "admin"} />;
}
