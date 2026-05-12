import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import TeamClient from "./Client";

// Admin-only — managing team members affects the public /team page.
export default async function AdminTeamPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");
    return <TeamClient />;
}
