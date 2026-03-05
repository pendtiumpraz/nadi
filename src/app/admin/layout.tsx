import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { getDB } from "@/lib/db";

async function getAdminTheme(): Promise<string> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'admin_theme'`;
        return rows.length > 0 ? (rows[0].value as string) : "v1";
    } catch {
        return "v1";
    }
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    const theme = await getAdminTheme();

    return (
        <div className={`adm-shell${theme === "v2" ? " adm-light" : ""}`}>
            <AdminNav user={{ name: session.user.name, email: session.user.email, role: session.user.role }} />
            <main className="adm-main">{children}</main>
        </div>
    );
}
