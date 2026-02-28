"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AdminNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
}

export default function AdminNav({ user }: AdminNavProps) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const links = [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/articles", label: "Articles" },
        { href: "/admin/ai", label: "AI Writer" },
        ...(user.role === "admin"
            ? [{ href: "/admin/users", label: "Users" }]
            : []),
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <header className="admin-topbar">
            <div className="admin-topbar-inner">
                <div className="admin-topbar-left">
                    <a href="/admin" className="admin-topbar-logo">
                        <span className="admin-topbar-logo-text">NADI</span>
                        <span className="admin-topbar-logo-sub">Admin</span>
                    </a>
                    <nav className={`admin-topbar-nav${menuOpen ? " open" : ""}`}>
                        {links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`admin-topbar-link${isActive(link.href) ? " active" : ""}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>
                <div className="admin-topbar-right">
                    <div className="admin-topbar-user">
                        <span className="admin-topbar-name">{user.name}</span>
                        <span className="admin-topbar-role">{user.role}</span>
                    </div>
                    <a href="/" className="admin-topbar-site" target="_blank">View Site</a>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="admin-topbar-logout"
                    >
                        Sign Out
                    </button>
                    <button className="admin-topbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                        <span /><span /><span />
                    </button>
                </div>
            </div>
        </header>
    );
}
