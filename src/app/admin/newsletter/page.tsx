import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import NewsletterAdmin from "@/components/NewsletterAdmin";

export default async function AdminNewsletterPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");

    return (
        <div className="admin-content">
            <div className="admin-content-header">
                <div>
                    <h1 className="admin-page-title">Newsletter Subscribers</h1>
                    <p className="admin-page-desc">Manage email subscribers. Activate, deactivate, or remove subscribers from the newsletter list.</p>
                </div>
            </div>
            <NewsletterAdmin />
        </div>
    );
}
