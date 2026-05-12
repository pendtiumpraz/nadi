import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import AdminConsentsList from "./AdminConsentsList";

export const dynamic = "force-dynamic";

export default async function AdminConsentsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canReview(session.user)) redirect("/admin");

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Submitted Consent Forms</h1>
            <p className="admin-page-desc">
                Articles awaiting publish — partners have submitted their consent-to-publish forms.
                Open one to inspect the form, then publish the article from its admin page.
            </p>
            <AdminConsentsList />
        </div>
    );
}
