"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLinkClick = () => {
        setMenuOpen(false);
    };

    return (
        <nav className={scrolled ? "scrolled" : ""}>
            <a href="#" className="nav-logo">
                <span className="nav-logo-word">NADI</span>
                <span className="nav-logo-sub">Research &amp; Policy Institute</span>
            </a>
            <ul className={`nav-links${menuOpen ? " open" : ""}`}>
                <li><a href="#about" onClick={handleLinkClick}>About</a></li>
                <li><a href="#areas" onClick={handleLinkClick}>Areas of Work</a></li>
                <li><a href="#methodology" onClick={handleLinkClick}>Methodology</a></li>
                <li><a href="#engage" onClick={handleLinkClick}>Who We Engage</a></li>
                <li><a href="#insights" onClick={handleLinkClick}>Insights</a></li>
                <li><a href="#contact" className="nav-cta" onClick={handleLinkClick}>Get in Touch</a></li>
            </ul>
            <div
                className={`hamburger${menuOpen ? " active" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
    );
}
