export default function Hero() {
    return (
        <section className="hero" id="home">
            <div className="hero-bg"></div>
            <div className="hero-watermark">NADI</div>
            <div className="hero-inner">
                <div className="hero-content">
                    <span className="hero-badge">A Research &amp; Policy Institute</span>
                    <p className="hero-eyebrow">
                        Network for Advancing Development &amp; Innovation in Health
                    </p>
                    <h1>
                        Institutional Thinking for <em>Complex</em> Health Systems
                    </h1>
                    <p className="hero-desc">
                        NADI (Network for Advancing Development &amp; Innovation in Health)
                        is a research and policy institute dedicated to advancing systemic,
                        evidence-informed solutions to complex healthcare challenges. In
                        Indonesian, &ldquo;Nadi&rdquo; means pulse — the fundamental signal
                        of life. We adopt this metaphor deliberately. A health
                        system&rsquo;s pulse is not technology alone, nor funding alone, nor
                        regulation alone. It is the coherence between policy, financing,
                        governance, and implementation. NADI works to strengthen that
                        coherence.
                    </p>
                    <div className="hero-actions">
                        <a href="#areas" className="btn-primary">Our Work</a>
                        <a href="/contact" className="btn-outline">Contact Us</a>
                    </div>
                </div>
                <div className="hero-right">
                    <div className="hero-stat-card">
                        <div className="stat-num">Nadi</div>
                        <div className="stat-label">Pulse — the fundamental signal of life</div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">4</div>
                        <div className="stat-label">Core Areas of Work</div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">Global</div>
                        <div className="stat-label">Cross-sector experience</div>
                    </div>
                    <div className="hero-stat-card">
                        <div className="stat-num">Systems</div>
                        <div className="stat-label">Coherence between policy, financing, governance &amp; implementation</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
