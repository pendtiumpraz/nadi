"use client";

import { ReactNode, useEffect, useState } from "react";

export default function V2PageLayout({ title, eyebrow, subtitle, children }: { title: string; eyebrow: string; subtitle?: string; children: ReactNode }) {
    const [logoUrl, setLogoUrl] = useState("/logo-nadi-color.png");
    useEffect(() => {
        let cancelled = false;
        fetch("/api/public/branding")
            .then((r) => r.json())
            .then((d) => { if (!cancelled && d?.logoUrl) setLogoUrl(d.logoUrl); })
            .catch(() => { /* keep default */ });
        return () => { cancelled = true; };
    }, []);
    return (
        <div className="v2">
            {/* NAV */}
            <nav className="v2-nav">
                <a href="/" className="v2-logo" aria-label="NADI">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="NADI" className="v2-logo-img" />
                </a>
                <ul className="v2-nav-links">
                    <li><a href="/#about">About</a></li>
                    <li><a href="/#areas">Work</a></li>
                    <li><a href="/team">Team</a></li>
                    <li><a href="/publications">Publications</a></li>
                    <li><a href="/events">Events</a></li>
                    <li><a href="/media">Media</a></li>
                    <li><a href="/contact" className="v2-nav-cta">Contact</a></li>
                </ul>
                <button className="v2-hamburger" aria-label="Menu" onClick={(e) => {
                    e.currentTarget.classList.toggle("active");
                    document.querySelector(".v2-nav-links")?.classList.toggle("open");
                }}>
                    <span /><span /><span />
                </button>
            </nav>

            {/* PAGE HEADER */}
            <section className="v2-page-header">
                <div className="v2-inner">
                    <p className="v2-eyebrow">{eyebrow}</p>
                    <h1 dangerouslySetInnerHTML={{ __html: title }} />
                    {subtitle && <p className="v2-page-subtitle">{subtitle}</p>}
                </div>
            </section>

            {/* CONTENT */}
            <section style={{ borderBottom: "none", paddingTop: "2rem" }}>
                <div className="v2-inner">
                    {children}
                </div>
            </section>

            {/* FOOTER */}
            <footer className="v2-footer">
                <div className="v2-footer-left">
                    <a href="/" className="v2-logo" aria-label="NADI">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="NADI" className="v2-logo-img" />
                    </a>
                    <p>Network for Advancing Development &amp; Innovation in Health.<br />Part of Inke Maris &amp; Associates.</p>
                </div>
                <div className="v2-footer-right">
                    <p>Jl. KH Abdullah Syafi&apos;i No. 28<br />Jakarta 12840, Indonesia</p>
                    <p style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                        <a href="/privacy-policy" style={{ color: "inherit", textDecoration: "underline", marginRight: "1rem" }}>Privacy Policy</a>
                        <a href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>Terms of Service</a>
                    </p>
                </div>
            </footer>
            <div className="v2-footer-bottom">
                © 2026 NADI — Network for Advancing Development &amp; Innovation in Health
            </div>
        </div>
    );
}
