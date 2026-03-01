"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLinkClick = () => setMenuOpen(false);

    return (
        <nav className={`site-nav${scrolled ? " scrolled" : ""}`}>
            <a href="/" className="nav-logo">
                <span className="nav-logo-word">NADI</span>
                <span className="nav-logo-sub">Advancing Development &amp; Innovation</span>
            </a>
            <ul className={`nav-links${menuOpen ? " open" : ""}`}>
                <li><a href="/#about" onClick={handleLinkClick}>About</a></li>
                <li><a href="/publications" onClick={handleLinkClick}>Publications</a></li>
                <li><a href="/events" onClick={handleLinkClick}>Events</a></li>
                <li><a href="/media" onClick={handleLinkClick}>Media</a></li>
                <li><a href="/contact" className="nav-cta" onClick={handleLinkClick}>Get in Touch</a></li>
            </ul>
            <button className={`hamburger${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                <span /><span /><span />
            </button>
        </nav>
    );
}
