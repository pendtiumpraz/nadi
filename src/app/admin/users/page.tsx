import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserManagementClient from "@/components/UserManagement";

export default async function UsersPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") redirect("/admin");

    return (
        <div className="admin-content">
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-desc">Add, edit roles, change passwords, and remove users.</p>
            <UserManagementClient />
        </div>
    );
}
