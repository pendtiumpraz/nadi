"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>("/logo-nadi-color.png");
    const { data: session, status } = useSession();
    const isAuthed = status === "authenticated" && !!session?.user;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Admin can override the brand logo through Settings → Branding. The
    // public branding endpoint returns DB-stored URLs (or the defaults
    // shipped in /public) so the override flows to every page that uses
    // this navbar without a redeploy.
    useEffect(() => {
        let cancelled = false;
        fetch("/api/public/branding")
            .then((r) => r.json())
            .then((d) => { if (!cancelled && d?.logoUrl) setLogoUrl(d.logoUrl); })
            .catch(() => { /* fallback default already set */ });
        return () => { cancelled = true; };
    }, []);

    const handleLinkClick = () => setMenuOpen(false);

    return (
        <nav className={`site-nav${scrolled ? " scrolled" : ""}`}>
            <a href="/" className="nav-logo" aria-label="NADI — Advancing Development & Innovation">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="NADI" className="nav-logo-img" />
            </a>
            <ul className={`nav-links${menuOpen ? " open" : ""}`}>
                <li><a href="/#about" onClick={handleLinkClick}>About</a></li>
                <li><a href="/#areas" onClick={handleLinkClick}>Areas</a></li>
                <li><a href="/#methodology" onClick={handleLinkClick}>Methodology</a></li>
                <li><a href="/publications" onClick={handleLinkClick}>Publications</a></li>
                <li><a href="/events" onClick={handleLinkClick}>Events</a></li>
                <li><a href="/media" onClick={handleLinkClick}>Media</a></li>
                {isAuthed ? (
                    <li><a href="/admin" onClick={handleLinkClick}>Dashboard</a></li>
                ) : (
                    <li><a href="/login" onClick={handleLinkClick}>Sign In</a></li>
                )}
                <li><a href="/contact" className="nav-cta" onClick={handleLinkClick}>Get in Touch</a></li>
            </ul>
            <button className={`hamburger${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                <span /><span /><span />
            </button>
        </nav>
    );
}
