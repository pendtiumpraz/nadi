"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

interface AdminNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
    allowedMenus?: string[];
}

export default function AdminNav({ user, allowedMenus }: AdminNavProps) {
    const pathname = usePathname();

    // Icons must all be MONOCHROME — no color emoji. Glyphs that can render
    // emoji-style on some platforms (✍ ✉ ⚙ ⏱) get the ︎ text-variation
    // selector appended to force the text presentation. Reinforced by CSS
    // `font-variant-emoji: text` on `.adm-sidebar-icon`.
    const ALL_LINKS: { href: string; label: string; icon: string; key: string; external?: boolean }[] = [
        { key: "dashboard", href: "/admin", label: "Dashboard", icon: "⊞" },
        { key: "articles", href: "/admin/articles", label: "Articles", icon: "✎" },
        { key: "events", href: "/admin/events", label: "Events", icon: "◈" },
        { key: "media", href: "/admin/media", label: "Media", icon: "▶" },
        { key: "review", href: "/admin/review", label: "Review Queue", icon: "✓" },
        { key: "topics", href: "/admin/topics", label: "Topics", icon: "☷" },
        { key: "consents", href: "/admin/consents", label: "Consents", icon: "✍︎" },
        { key: "team", href: "/admin/team", label: "Team", icon: "◉" },
        { key: "newsletter", href: "/admin/newsletter", label: "Newsletter", icon: "✉︎" },
        { key: "ai", href: "/admin/ai", label: "AI Writer", icon: "✦" },
        { key: "docs", href: "/admin/docs", label: "Docs", icon: "◇" },
        { key: "policy-guideline", href: "/policy-guideline", label: "Guideline", icon: "⬇", external: true },
        { key: "guidelines", href: "/admin/guidelines", label: "Guidelines", icon: "⬆" },
        { key: "settings", href: "/admin/settings", label: "Settings", icon: "⚙︎" },
        { key: "users", href: "/admin/users", label: "Users", icon: "⊕" },
        { key: "permissions", href: "/admin/permissions", label: "Permissions", icon: "⊟" },
        { key: "audit", href: "/admin/audit", label: "Audit Log", icon: "◷" },
    ];

    const allowedKeys = new Set(allowedMenus || ALL_LINKS.map((l) => l.key));
    const links = ALL_LINKS.filter((l) => allowedKeys.has(l.key));

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Top bar — ONLY logo left, logout right */}
            <header className="adm-topbar">
                <a href="/admin" className="adm-topbar-logo">
                    <span className="adm-topbar-logo-text">NADI</span>
                    <span className="adm-topbar-logo-sub">Admin</span>
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
                    <NotificationBell />
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="adm-topbar-logout">Sign Out</button>
                </div>
            </header>

            {/* Sidebar — menu links */}
            <aside className="adm-sidebar">
                <div className="adm-sidebar-nav">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            target={link.external ? "_blank" : undefined}
                            rel={link.external ? "noopener noreferrer" : undefined}
                            className={`adm-sidebar-link${!link.external && isActive(link.href) ? " active" : ""}`}
                        >
                            <span className="adm-sidebar-icon">{link.icon}</span>
                            <span className="adm-sidebar-label">{link.label}</span>
                        </a>
                    ))}
                </div>
                <div className="adm-sidebar-bottom">
                    <div className="adm-sidebar-user">{user.name}</div>
                    <div className="adm-sidebar-role">{user.role}</div>
                    <a href="/" className="adm-sidebar-site" target="_blank">← View Site</a>
                </div>
            </aside>
        </>
    );
}
