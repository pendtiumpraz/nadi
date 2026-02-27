import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="admin-layout">
            <AdminNav user={session.user} />
            <main className="admin-main">{children}</main>
        </div>
    );
}
