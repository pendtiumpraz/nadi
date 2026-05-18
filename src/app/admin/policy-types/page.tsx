import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canPublish } from "@/lib/permissions";
import PolicyTypesClient from "./Client";

export const dynamic = "force-dynamic";

export default async function PolicyTypesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canPublish(session.user)) redirect("/admin");
    return <PolicyTypesClient />;
}
