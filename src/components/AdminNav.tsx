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
        { href: "/admin", label: "Dashboard", icon: "◫" },
        { href: "/admin/articles", label: "Articles", icon: "◧" },
        { href: "/admin/ai", label: "AI Generator", icon: "✦" },
        ...(user.role === "admin"
            ? [{ href: "/admin/users", label: "Users", icon: "◩" }]
            : []),
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-brand">
                <a href="/" className="admin-logo">NADI</a>
                <span className="admin-logo-sub">Admin Panel</span>
            </div>
            <nav className="admin-nav">
                {links.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`admin-nav-link${isActive(link.href) ? " active" : ""}`}
                    >
                        <span className="admin-nav-icon">{link.icon}</span>
                        {link.label}
                    </a>
                ))}
            </nav>
            <div className="admin-sidebar-footer">
                <div className="admin-user-info">
                    <span className="admin-user-name">{user.name}</span>
                    <span className="admin-user-role">{user.role}</span>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="admin-logout"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
