import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import AuditLogViewer from "./AuditLogViewer";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");

    return (
        <div className="admin-content">
            <h1 className="admin-page-title">Audit Log</h1>
            <p className="admin-page-desc">
                Read-only timeline of platform activity. Useful for incident review and access auditing.
            </p>
            <AuditLogViewer />
        </div>
    );
}
