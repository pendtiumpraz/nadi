import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="adm-shell">
            <AdminNav user={{ name: session.user.name, email: session.user.email, role: session.user.role }} />
            <main className="adm-main">{children}</main>
        </div>
    );
}
