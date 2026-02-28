"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface AdminNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
}

export default function AdminNav({ user }: AdminNavProps) {
    const pathname = usePathname();

    const links = [
        { href: "/admin", label: "Dashboard", icon: "⊞" },
        { href: "/admin/articles", label: "Articles", icon: "✎" },
        { href: "/admin/ai", label: "AI Writer", icon: "✦" },
        ...(user.role === "admin"
            ? [{ href: "/admin/users", label: "Users", icon: "⊕" }]
            : []),
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Top navbar — logo + logout only */}
            <header className="adm-topbar">
                <a href="/admin" className="adm-topbar-logo">
                    <span className="adm-topbar-logo-text">NADI</span>
                    <span className="adm-topbar-logo-sub">Admin Panel</span>
                </a>
                <div className="adm-topbar-right">
                    <span className="adm-topbar-user">{user.name} <span className="adm-topbar-role">{user.role}</span></span>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="adm-topbar-logout">Sign Out</button>
                </div>
            </header>

            {/* Left sidebar — navigation */}
            <aside className="adm-sidebar">
                <nav className="adm-sidebar-nav">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`adm-sidebar-link${isActive(link.href) ? " active" : ""}`}
                        >
                            <span className="adm-sidebar-icon">{link.icon}</span>
                            <span className="adm-sidebar-label">{link.label}</span>
                        </a>
                    ))}
                </nav>
                <div className="adm-sidebar-footer">
                    <a href="/" className="adm-sidebar-site" target="_blank">← View Site</a>
                </div>
            </aside>
        </>
    );
}
