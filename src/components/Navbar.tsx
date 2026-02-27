"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={scrolled ? "scrolled" : ""}>
            <a href="/" className="nav-logo">
                <span className="nav-logo-word">NADI</span>
                <span className="nav-logo-sub">Research &amp; Policy Institute</span>
            </a>
            <ul className="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/contact" className="nav-cta">Contact Us</a></li>
            </ul>
        </nav>
    );
}
