import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { asRole } from "@/lib/permissions";
import MediaClient from "./Client";

// Admin / reviewer / contributor / partner can land here. The API filters partner
// queries to their own rows, and the client list reflects that.
export default async function AdminMediaPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    const role = asRole(session.user.role);
    if (role !== "admin" && role !== "reviewer" && role !== "contributor" && role !== "partner") {
        redirect("/admin");
    }
    return <MediaClient />;
}
