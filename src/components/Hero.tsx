export default function Hero() {
    return (
        <section className="hero" id="home">
            <div className="hero-bg"></div>
            <div className="hero-watermark">NADI</div>
            <div className="hero-inner">
                <div className="hero-content">
                    <span className="hero-badge">A Research and Policy Institute</span>
                    <p className="hero-eyebrow">
                        Network for Advancing Development &amp; Innovation in Health
                    </p>
                    <h1>
                        Institutional Thinking for <em>Complex</em> Health Systems
                    </h1>
                    <p className="hero-desc">
                        NADI works at the intersection of policy, financing, governance, and
                        implementation — restoring coherence to systems that shape health
                        outcomes at scale.
                    </p>
                    <div className="hero-actions">
                        <a href="#areas" className="btn-primary">
                            Our Work
                        </a>
                        <a href="#contact" className="btn-outline">
                            Partner With Us
                        </a>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="hero-stat-card">
                        <div className="stat-num">Nadi</div>
                        <div className="stat-label">
                            Pulse — the fundamental signal of life
                        </div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">4</div>
                        <div className="stat-label">
                            Core Areas of Strategic Engagement
                        </div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">Global</div>
                        <div className="stat-label">
                            Cross-sector, multi-institutional expertise
                        </div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">Systems</div>
                        <div className="stat-label">
                            Orientation — not isolated interventions
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
