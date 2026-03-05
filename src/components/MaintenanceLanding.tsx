export default function MaintenanceLanding() {
    return (
        <div className="v2" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* NAV */}
            <nav className="v2-nav">
                <a href="/" className="v2-logo">
                    <span className="v2-logo-name">NADI</span>
                    <span className="v2-logo-by">advancing development &amp; innovation</span>
                </a>
            </nav>

            {/* CONTENT */}
            <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 6% 0", textAlign: "center" }}>
                <div style={{ maxWidth: 520 }}>
                    <p className="v2-hero-tag" style={{ justifyContent: "center" }}>Under Development</p>
                    <h1>Something is <em>coming</em></h1>
                    <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "#888", fontWeight: 300, marginBottom: "2.5rem" }}>
                        This page is currently being built. We are working on it and will have it ready soon. In the meantime, feel free to get in touch.
                    </p>
                    <a href="/contact" className="v2-btn-ghost">← Contact Us</a>
                </div>
            </main>
        </div>
    );
}
