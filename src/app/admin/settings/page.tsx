import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import SettingsClient from "./Client";

// Admin only — touches site-wide settings (themes, CC list, security throttle, terms body).
export default async function AdminSettingsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");
    return <SettingsClient />;
}
