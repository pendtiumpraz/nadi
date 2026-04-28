import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import PermissionsMatrix from "@/components/PermissionsMatrix";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Role &amp; Menu Access</h1>
            <p className="admin-page-desc">
                Toggle which admin pages each role can see in the sidebar. Admin always has full access (locked).
                Server routes still enforce their own role checks — this matrix only controls navigation visibility.
            </p>
            <PermissionsMatrix />
        </div>
    );
}
