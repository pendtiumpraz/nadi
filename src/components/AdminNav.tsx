"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

interface BrandingURLs {
    logoUrl: string;
    logoWhiteUrl: string;
}

interface AdminNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        role: string;
    };
    allowedMenus?: string[];
}

// Icons must all be MONOCHROME — no color emoji. Glyphs that can render
// emoji-style on some platforms (✍ ✉ ⚙ ⏱) get the ︎ text-variation
// selector appended to force the text presentation. Reinforced by CSS
// `font-variant-emoji: text` on `.adm-sidebar-icon`.
interface NavLink {
    href: string;
    label: string;
    icon: string;
    key: string;
    external?: boolean;
}

interface NavCategory {
    id: string;
    label: string;
    links: NavLink[];
    /** Default collapsed state on first load. */
    defaultCollapsed?: boolean;
}

// Top-of-sidebar links — always visible, not inside any category.
const STANDALONE_LINKS: NavLink[] = [
    { key: "dashboard", href: "/admin", label: "Dashboard", icon: "⊞" },
];

// The rest grouped by purpose. Adding a new admin page? Drop it in the
// matching category — sidebar groups, headers, and collapse state come for
// free.
const CATEGORIES: NavCategory[] = [
    {
        id: "content",
        label: "Content",
        links: [
            { key: "articles", href: "/admin/articles", label: "Articles", icon: "✎" },
            { key: "events", href: "/admin/events", label: "Events", icon: "◈" },
            { key: "media", href: "/admin/media", label: "Media", icon: "▶" },
        ],
    },
    {
        id: "workflow",
        label: "Workflow",
        links: [
            { key: "review", href: "/admin/review", label: "Review Queue", icon: "✓" },
            { key: "consents", href: "/admin/consents", label: "Consents", icon: "✍︎" },
        ],
    },
    {
        id: "engagement",
        label: "Engagement",
        links: [
            { key: "newsletter", href: "/admin/newsletter", label: "Newsletter", icon: "✉︎" },
            { key: "team", href: "/admin/team", label: "Team", icon: "◉" },
        ],
    },
    {
        id: "tools",
        label: "Tools",
        links: [
            { key: "ai", href: "/admin/ai", label: "AI Writer", icon: "✦" },
            { key: "guidelines", href: "/admin/guidelines", label: "Guidelines", icon: "⬆" },
            { key: "policy-types", href: "/admin/policy-types", label: "Policy Types", icon: "◧" },
            { key: "docs", href: "/admin/docs", label: "Docs", icon: "◇" },
        ],
    },
    {
        id: "system",
        label: "System",
        defaultCollapsed: true,
        links: [
            { key: "settings", href: "/admin/settings", label: "Settings", icon: "⚙︎" },
            { key: "users", href: "/admin/users", label: "Users", icon: "⊕" },
            { key: "permissions", href: "/admin/permissions", label: "Permissions", icon: "⊟" },
            { key: "audit", href: "/admin/audit", label: "Audit Log", icon: "◷" },
        ],
    },
];

const ALL_KEYS = [...STANDALONE_LINKS, ...CATEGORIES.flatMap((c) => c.links)].map((l) => l.key);
const COLLAPSE_STORAGE_KEY = "nadi_admin_sidebar_collapsed";

export default function AdminNav({ user, allowedMenus }: AdminNavProps) {
    const pathname = usePathname();
    // Dashboard topbar is dark by default — load the white variant. Admin
    // can override both URLs through Settings → Branding; fallback to the
    // static files shipped in /public.
    const [branding, setBranding] = useState<BrandingURLs>({ logoUrl: "/logo-nadi-color.png", logoWhiteUrl: "/logo-nadi-white.png" });
    useEffect(() => {
        let cancelled = false;
        fetch("/api/public/branding")
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                setBranding({
                    logoUrl: d?.logoUrl || "/logo-nadi-color.png",
                    logoWhiteUrl: d?.logoWhiteUrl || "/logo-nadi-white.png",
                });
            })
            .catch(() => { /* fallback already set */ });
        return () => { cancelled = true; };
    }, []);

    const allowedKeys = new Set(allowedMenus || ALL_KEYS);
    const standalone = STANDALONE_LINKS.filter((l) => allowedKeys.has(l.key));
    const visibleCategories = CATEGORIES
        .map((cat) => ({ ...cat, links: cat.links.filter((l) => allowedKeys.has(l.key)) }))
        .filter((cat) => cat.links.length > 0);

    // Collapse state per category, persisted in localStorage so the user's
    // preference survives navigation and reloads.
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const cat of CATEGORIES) init[cat.id] = !!cat.defaultCollapsed;
        return init;
    });
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, boolean>;
                setCollapsed((prev) => ({ ...prev, ...parsed }));
            }
        } catch {
            /* ignore — sidebar still works without persistence */
        }
    }, []);
    const toggle = (id: string) => {
        setCollapsed((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            try {
                window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(next));
            } catch { /* ignore */ }
            return next;
        });
    };

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    const renderLink = (link: NavLink) => (
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
    );

    return (
        <>
            {/* Top bar — ONLY logo left, logout right */}
            <header className="adm-topbar">
                <a href="/admin" className="adm-topbar-logo" aria-label="NADI Admin">
                    {/* Dark topbar gets the white variant; .adm-light theme
                        flips to the colour variant via CSS. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={branding.logoWhiteUrl} alt="NADI" className="adm-topbar-logo-img on-dark" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={branding.logoUrl} alt="NADI" className="adm-topbar-logo-img on-light" />
                    <span className="adm-topbar-logo-sub">Admin</span>
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
                    <NotificationBell />
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="adm-topbar-logout">Sign Out</button>
                </div>
            </header>

            {/* Sidebar — grouped menu links with collapsible categories */}
            <aside className="adm-sidebar">
                <div className="adm-sidebar-nav">
                    {standalone.map(renderLink)}
                    {visibleCategories.map((cat) => {
                        const isCollapsed = collapsed[cat.id];
                        const hasActive = cat.links.some((l) => !l.external && isActive(l.href));
                        return (
                            <div key={cat.id} className="adm-sidebar-group">
                                <button
                                    type="button"
                                    onClick={() => toggle(cat.id)}
                                    className={`adm-sidebar-group-header${hasActive ? " has-active" : ""}`}
                                    aria-expanded={!isCollapsed}
                                >
                                    <span className="adm-sidebar-group-label">{cat.label}</span>
                                    <span className="adm-sidebar-group-chevron" aria-hidden>
                                        {isCollapsed ? "▸" : "▾"}
                                    </span>
                                </button>
                                {!isCollapsed && (
                                    <div className="adm-sidebar-group-links">
                                        {cat.links.map(renderLink)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
