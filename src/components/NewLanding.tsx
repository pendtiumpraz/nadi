"use client";

import { useEffect, useState } from "react";

interface TeamMember {
    id: number;
    name: string;
    title: string;
    bio: string;
    initials: string;
    photoUrl: string;
    linkedinUrl: string;
    isFeatured: boolean;
}

export default function NewLanding() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);


    useEffect(() => {
        fetch("/api/public/team?featured=true")
            .then((r) => r.json())
            .then((data) => {
                if (data.members && data.members.length > 0) {
                    setTeamMembers(data.members);
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {

        // Subscription handler
        const subEmail = document.getElementById("subEmail") as HTMLInputElement | null;
        const subConfirm = document.getElementById("subConfirm");
        const subBtn = document.querySelector(".v2-sub-btn") as HTMLButtonElement | null;

        function handleSub() {
            if (!subEmail || !subBtn || !subConfirm) return;
            const email = subEmail.value.trim();
            if (!email || !email.includes("@")) {
                subEmail.style.borderColor = "#c0392b";
                return;
            }
            subBtn.textContent = "✓ Done";
            subBtn.style.background = "#2C7A4B";
            subEmail.disabled = true;
            subBtn.disabled = true;
            subConfirm.style.display = "block";
        }

        if (subBtn) subBtn.addEventListener("click", handleSub);
        if (subEmail) {
            subEmail.addEventListener("keydown", function (e) {
                if (e.key === "Enter") handleSub();
                this.style.borderColor = "";
            });
        }
    }, []);

    return (
        <div className="v2">
            {/* NAV */}
            <nav className="v2-nav">
                <a href="/" className="v2-logo">
                    <span className="v2-logo-name">NADI</span>
                    <span className="v2-logo-by">advancing development &amp; innovation</span>
                </a>
                <ul className="v2-nav-links">
                    <li><a href="#about">About</a></li>
                    <li><a href="#areas">Work</a></li>
                    <li><a href="/team">Team</a></li>
                    <li><a href="/publications">Publications</a></li>
                    <li><a href="/events">Events</a></li>
                    <li><a href="/media">Media</a></li>
                    <li><a href="/contact" className="v2-nav-cta">Contact</a></li>
                </ul>
                <button className="v2-hamburger" aria-label="Menu" onClick={(e) => {
                    const btn = e.currentTarget;
                    const links = document.querySelector('.v2-nav-links');
                    btn.classList.toggle('active');
                    links?.classList.toggle('open');
                }}>
                    <span /><span /><span />
                </button>
            </nav>

            {/* HERO */}
            <section className="v2-hero" id="home">
                <div className="v2-hero-inner">
                    <p className="v2-hero-tag">Network for Advancing Development &amp; Innovation in Health</p>
                    <h1>Institutional thinking for <em>complex</em> health systems</h1>
                    <p className="v2-hero-sub">
                        NADI —a part of <strong>Inke Maris &amp; Associates</strong>— works at the intersection of public affairs, policy, governance, and implementation. Restoring coherence to systems that shape health outcomes at scale.
                    </p>
                    <div className="v2-hero-actions" style={{ marginTop: "2rem" }}>
                        <a href="#areas" className="v2-btn-primary">Our Work</a>
                        <a href="/contact" className="v2-btn-ghost">Partner With Us</a>
                    </div>
                </div>

                <div className="v2-hero-visual">
                    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="75" x2="480" y2="75" stroke="#E8E5E1" strokeWidth="1" />
                        <line x1="0" y1="150" x2="480" y2="150" stroke="#E8E5E1" strokeWidth="1" />
                        <line x1="0" y1="225" x2="480" y2="225" stroke="#E8E5E1" strokeWidth="1" />
                        <line x1="120" y1="10" x2="120" y2="290" stroke="#E8E5E1" strokeWidth="1" />
                        <line x1="240" y1="10" x2="240" y2="290" stroke="#E8E5E1" strokeWidth="1" />
                        <line x1="360" y1="10" x2="360" y2="290" stroke="#E8E5E1" strokeWidth="1" />
                        <text x="6" y="71" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#bbb" letterSpacing="0.5">PUBLIC AFFAIRS</text>
                        <text x="6" y="146" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#bbb" letterSpacing="0.5">GOVERNANCE</text>
                        <text x="6" y="221" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#bbb" letterSpacing="0.5">IMPLEMENTATION</text>
                        <polyline className="v2-pulse-line"
                            points="0,150 30,150 45,150 55,95 65,210 75,55 88,255 100,150 130,150 165,150 178,150 188,118 198,182 208,80 220,240 232,150 255,150 290,150 303,150 313,125 323,175 333,95 345,215 357,150 390,150 430,150 455,150"
                            stroke="#8B1C1C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        <circle className="v2-pulse-dot" cx="455" cy="150" r="4" fill="#8B1C1C" />
                        <text x="240" y="285" fontFamily="'Cormorant Garamond',serif" fontSize="10" fill="#E0DDD9" textAnchor="middle" letterSpacing="6" fontStyle="italic">health systems pulse</text>
                    </svg>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about">
                <div className="v2-inner">
                    <div className="v2-about-grid">
                        <div>
                            <p className="v2-eyebrow">About</p>
                            <h2>A platform for engagement at the <em>system level</em></h2>
                            <p className="v2-body-text">NADI is a research and policy institute. Neither a transactional firm nor a detached academic centre — but a platform for structured, strategic engagement at the system level. Cross-sectoral, interdisciplinary, and multi-institutional collaboration enables the delivery of comprehensive and sustainable solutions.</p>
                            <div className="v2-about-visual">
                                <svg viewBox="0 0 360 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="120" cy="95" r="72" fill="#8B1C1C" fillOpacity="0.06" stroke="#8B1C1C" strokeOpacity="0.2" strokeWidth="1" />
                                    <circle cx="190" cy="60" r="72" fill="#8B1C1C" fillOpacity="0.06" stroke="#8B1C1C" strokeOpacity="0.2" strokeWidth="1" />
                                    <circle cx="190" cy="130" r="72" fill="#8B1C1C" fillOpacity="0.06" stroke="#8B1C1C" strokeOpacity="0.2" strokeWidth="1" />
                                    <circle cx="168" cy="95" r="10" fill="#8B1C1C" fillOpacity="0.75" />
                                    <text x="168" y="115" fontFamily="'Cormorant Garamond',serif" fontSize="8.5" fill="#8B1C1C" textAnchor="middle" fontStyle="italic">NADI</text>
                                    <text x="52" y="100" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#666" fontWeight="500">Public Affairs</text>
                                    <text x="210" y="38" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#666" fontWeight="500">Policy</text>
                                    <text x="200" y="165" fontFamily="'DM Sans',sans-serif" fontSize="9" fill="#666" fontWeight="500">Governance</text>
                                </svg>
                            </div>
                        </div>
                        <div className="v2-about-right">
                            <blockquote className="v2-about-quote">&ldquo;A health system&apos;s pulse is coherence between public affairs, policy, governance, and implementation.&rdquo;</blockquote>
                            <div className="v2-about-pillars">
                                <div className="v2-pillar">
                                    <span className="v2-pillar-label">Rigorous</span>
                                    <span className="v2-pillar-text">Intellectually grounded, financially realistic, politically feasible.</span>
                                </div>
                                <div className="v2-pillar">
                                    <span className="v2-pillar-label">Executable</span>
                                    <span className="v2-pillar-text">Every recommendation must hold up against implementation reality.</span>
                                </div>
                                <div className="v2-pillar">
                                    <span className="v2-pillar-label">Long-term</span>
                                    <span className="v2-pillar-text">Short-term visibility must never undermine structural sustainability.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AREAS */}
            <section id="areas">
                <div className="v2-inner">
                    <div className="v2-areas-intro">
                        <div>
                            <p className="v2-eyebrow">Core Areas of Work</p>
                            <h2>Where NADI <em>engages</em></h2>
                            <p className="v2-body-text" style={{ marginTop: "0.5rem" }}>Structured analysis at every stage of health system decision-making — from regulatory strategy to governance design.</p>
                        </div>
                        <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 220, margin: "auto" }}>
                            <rect x="1" y="1" width="122" height="122" rx="2" fill="#fff" stroke="#E8E5E1" strokeWidth="1" />
                            <rect x="137" y="1" width="122" height="122" rx="2" fill="#8B1C1C" fillOpacity="0.05" stroke="#8B1C1C" strokeOpacity="0.25" strokeWidth="1" />
                            <rect x="1" y="137" width="122" height="122" rx="2" fill="#8B1C1C" fillOpacity="0.05" stroke="#8B1C1C" strokeOpacity="0.25" strokeWidth="1" />
                            <rect x="137" y="137" width="122" height="122" rx="2" fill="#fff" stroke="#E8E5E1" strokeWidth="1" />
                            <circle cx="62" cy="45" r="14" stroke="#8B1C1C" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
                            <circle cx="62" cy="45" r="7" stroke="#8B1C1C" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
                            <circle cx="62" cy="45" r="2" fill="#8B1C1C" />
                            <rect x="184" y="60" width="7" height="20" fill="#8B1C1C" fillOpacity="0.4" />
                            <rect x="195" y="48" width="7" height="32" fill="#8B1C1C" fillOpacity="0.6" />
                            <rect x="206" y="38" width="7" height="42" fill="#8B1C1C" />
                            <circle cx="62" cy="158" r="5" stroke="#8B1C1C" strokeWidth="1.5" fill="none" />
                            <circle cx="46" cy="178" r="4" stroke="#8B1C1C" strokeWidth="1.2" fill="none" />
                            <circle cx="78" cy="178" r="4" stroke="#8B1C1C" strokeWidth="1.2" fill="none" />
                            <circle cx="62" cy="196" r="4" stroke="#8B1C1C" strokeWidth="1.2" fill="none" />
                            <line x1="62" y1="163" x2="48" y2="174" stroke="#8B1C1C" strokeOpacity="0.4" strokeWidth="1" />
                            <line x1="62" y1="163" x2="76" y2="174" stroke="#8B1C1C" strokeOpacity="0.4" strokeWidth="1" />
                            <line x1="50" y1="182" x2="62" y2="192" stroke="#8B1C1C" strokeOpacity="0.4" strokeWidth="1" />
                            <line x1="74" y1="182" x2="62" y2="192" stroke="#8B1C1C" strokeOpacity="0.4" strokeWidth="1" />
                            <rect x="185" y="152" width="34" height="42" rx="1" stroke="#8B1C1C" strokeOpacity="0.3" strokeWidth="1.5" fill="none" />
                            <line x1="192" y1="163" x2="212" y2="163" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1.2" />
                            <line x1="192" y1="171" x2="212" y2="171" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1.2" />
                            <line x1="192" y1="179" x2="205" y2="179" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1.2" />
                            <text x="62" y="74" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="#555" textAnchor="middle">Public Affairs</text>
                            <text x="198" y="92" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="#555" textAnchor="middle">Str. Training</text>
                            <text x="62" y="214" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="#555" textAnchor="middle">Governance</text>
                            <text x="198" y="207" fontFamily="'DM Sans',sans-serif" fontSize="7.5" fill="#555" textAnchor="middle">Policy Design</text>
                            <circle cx="130" cy="130" r="14" fill="none" stroke="#8B1C1C" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 3" />
                            <text x="130" y="127" fontFamily="'Cormorant Garamond',serif" fontSize="7.5" fill="#8B1C1C" textAnchor="middle" fontStyle="italic">system</text>
                            <text x="130" y="137" fontFamily="'Cormorant Garamond',serif" fontSize="7.5" fill="#8B1C1C" textAnchor="middle" fontStyle="italic">level</text>
                        </svg>
                    </div>

                    <div className="v2-areas-grid">
                        {[
                            { num: "01", icon: "bullseye", title: "Public Affairs & Communication", text: "Interpreting institutional incentives, identifying leverage points, and designing coherent public affairs strategies anchored in evidence — across regulatory, fiscal, and geopolitical dynamics." },
                            { num: "02", icon: "bars", title: "Strategic Training & Institutional Literacy", text: "Case-based, empirically grounded programs for leaders who need to understand structure, incentives, and long-term system implications. Designed for senior decision-makers." },
                            { num: "03", icon: "network", title: "Governance & Project Management", text: "Designing governance structures, stakeholder coordination mechanisms, and performance alignment frameworks for complex global health initiatives." },
                            { num: "04", icon: "doc", title: "Policy Design & Advocacy Architecture", text: "From evidence-informed formulation to regulatory pathway analysis — structuring incentives, clarifying trade-offs, and ensuring sustainability." },
                        ].map((a) => (
                            <div className="v2-area" key={a.num}>
                                <div className="v2-area-header">
                                    {a.icon === "bullseye" && (
                                        <svg className="v2-area-icon" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="14" stroke="#8B1C1C" strokeOpacity="0.3" strokeWidth="1.5" fill="none" /><circle cx="20" cy="20" r="8" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1.5" fill="none" /><circle cx="20" cy="20" r="3" fill="#8B1C1C" /></svg>
                                    )}
                                    {a.icon === "bars" && (
                                        <svg className="v2-area-icon" viewBox="0 0 40 40" fill="none"><rect x="10" y="28" width="6" height="8" fill="#8B1C1C" fillOpacity="0.4" /><rect x="18" y="20" width="6" height="16" fill="#8B1C1C" fillOpacity="0.65" /><rect x="26" y="12" width="6" height="24" fill="#8B1C1C" /></svg>
                                    )}
                                    {a.icon === "network" && (
                                        <svg className="v2-area-icon" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="4" stroke="#8B1C1C" strokeWidth="1.5" fill="none" /><circle cx="11" cy="28" r="3.5" stroke="#8B1C1C" strokeWidth="1.2" fill="none" /><circle cx="29" cy="28" r="3.5" stroke="#8B1C1C" strokeWidth="1.2" fill="none" /><line x1="20" y1="18" x2="12.5" y2="24.5" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1" /><line x1="20" y1="18" x2="27.5" y2="24.5" stroke="#8B1C1C" strokeOpacity="0.5" strokeWidth="1" /></svg>
                                    )}
                                    {a.icon === "doc" && (
                                        <svg className="v2-area-icon" viewBox="0 0 40 40" fill="none"><rect x="10" y="8" width="22" height="28" rx="1" stroke="#8B1C1C" strokeOpacity="0.3" strokeWidth="1.5" fill="none" /><line x1="15" y1="16" x2="27" y2="16" stroke="#8B1C1C" strokeOpacity="0.55" strokeWidth="1.5" /><line x1="15" y1="21" x2="27" y2="21" stroke="#8B1C1C" strokeOpacity="0.55" strokeWidth="1.5" /><line x1="15" y1="26" x2="22" y2="26" stroke="#8B1C1C" strokeOpacity="0.55" strokeWidth="1.5" /></svg>
                                    )}
                                    <span className="v2-area-num">{a.num}</span>
                                </div>
                                <h3>{a.title}</h3>
                                <p>{a.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PARTNERS */}
            <section className="v2-partners" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
                <p className="v2-partners-label" style={{ marginBottom: "1rem" }}>Institutional Experience</p>
                <div className="v2-marquee-track">
                    <div className="v2-marquee-inner">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} style={{ display: "flex" }}>
                                {["Indonesian Ministry of Health", "Nanyang Technological University", "Carnegie Mellon University", "Monash University", "Institut Teknologi Bandung", "University of Pittsburgh", "Boston University School of Medicine", "UNICEF", "UnitedHealth Group", "Novo Nordisk", "Pfizer", "Biofarma", "Boston Children's Hospital", "International Vaccine Institute", "Alvarez & Marsal", "Maerki Baumann & Co."].map((c) => (
                                    <div className="v2-chip" key={`${i}-${c}`}>{c}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LEADERSHIP */}
            <section id="leadership">
                <div className="v2-inner">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "1.5rem" }}>
                        <div>
                            <p className="v2-eyebrow">Leadership &amp; Experts</p>
                            <h2>The people behind <em>the work</em></h2>
                        </div>
                        <a href="/team" className="v2-link-more">Full Team →</a>
                    </div>
                    <div className="v2-team-grid">
                        {(teamMembers.length > 0 ? teamMembers : [
                            { id: 0, initials: "W", name: "Dr. Widyaretna Buenastuti", title: "Founder & Director", bio: "Health policy strategist with 20+ years across MoH, multilaterals, and global health institutions.", photoUrl: "", linkedinUrl: "", isFeatured: true },
                            { id: 1, initials: "S", name: "Soleh Ayubi, PhD", title: "Co-founder & Partner", bio: "Healthcare strategist with almost 20 years across academia, large corporations, and global health institutions.", photoUrl: "", linkedinUrl: "", isFeatured: true },
                        ]).map((m) => (
                            <div className="v2-team-card" key={m.id}>
                                <div className="v2-team-avatar">
                                    {m.photoUrl ? (
                                        <img src={m.photoUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                    ) : (
                                        <span>{m.initials || m.name[0]}</span>
                                    )}
                                </div>
                                <div className="v2-team-info">
                                    <h4>{m.name}</h4>
                                    <p className="v2-team-title">{m.title}</p>
                                    <p className="v2-team-bio">{m.bio}</p>
                                    <a href={m.linkedinUrl || "#"} target={m.linkedinUrl ? "_blank" : undefined} rel="noopener noreferrer" className="v2-link-more" style={{ marginTop: "0.5rem", fontSize: "0.7rem" }}>in LinkedIn →</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* PUBLICATIONS */}
            <section id="publications">
                <div className="v2-inner">
                    <p className="v2-eyebrow">Insights &amp; Publications</p>
                    <h2>Latest <em>thinking</em></h2>

                    <div className="v2-sub-bar">
                        <div className="v2-sub-text">
                            <span className="v2-sub-label">Stay informed</span>
                            <span className="v2-sub-desc">Receive new publications and insights directly to your inbox.</span>
                        </div>
                        <div className="v2-sub-form">
                            <input type="email" className="v2-sub-input" placeholder="your@email.com" id="subEmail" />
                            <button className="v2-sub-btn">Subscribe</button>
                        </div>
                        <p className="v2-sub-confirm" id="subConfirm">✓ You&apos;re subscribed. Thank you.</p>
                    </div>

                    <div className="v2-pub-visual">
                        {[40, 65, 50, 80, 55, 90, 70, 100, 75, 85, 60, 95].map((h, i) => (
                            <div key={i} className={`v2-pub-bar${h >= 80 ? " hi" : ""}`} style={{ height: `${h}%` }} />
                        ))}
                    </div>

                    <div className="v2-pub-list">
                        {[
                            { type: "Policy Brief", date: "Feb 2026", title: "Rethinking Health Financing Sustainability in Post-Pandemic Indonesia", desc: "Examining structural tensions between universal coverage ambitions and fiscal reality — with a framework for long-term sustainability grounded in empirical evidence and political feasibility.", slug: "health-financing-southeast-asia" },
                            { type: "Working Paper", date: "Jan 2026", title: "When Public-Private Partnerships Fail: A Diagnostic Framework", desc: "Misaligned incentives, not bad intentions, drive most PPP breakdowns in global health.", slug: "vaccine-governance-global-south" },
                            { type: "Research Note", date: "Dec 2025", title: "Indonesia's Tuberculosis Challenge: A Systems Perspective", desc: "TB persists not due to lack of tools, but failure of system alignment across diagnosis, treatment, and prevention.", slug: "policy-coherence-universal-health-coverage" },
                        ].map((p) => (
                            <a href={`/publications/${p.slug}`} className="v2-pub-item" key={p.slug}>
                                <div className="v2-pub-meta">
                                    <span className="v2-pub-type">{p.type}</span>
                                    <span className="v2-pub-date">{p.date}</span>
                                </div>
                                <div className="v2-pub-body">
                                    <h3>{p.title}</h3>
                                    <p>{p.desc}</p>
                                </div>
                                <span className="v2-pub-arrow">→</span>
                            </a>
                        ))}
                    </div>
                    <div style={{ marginTop: "2rem", textAlign: "center" }}>
                        <a href="/publications" className="v2-btn-ghost">View All Publications</a>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="v2-cta" id="contact">
                <div className="v2-inner">
                    <p className="v2-eyebrow" style={{ justifyContent: "center" }}>Get in Touch</p>
                    <h2>Ready to <em>engage?</em></h2>
                    <p>Whether you are a government ministry, multilateral organization, life sciences company, or philanthropic foundation — NADI is ready.</p>
                    <div className="v2-cta-partners">
                        {[
                            { icon: "🏛️", label: "Government" },
                            { icon: "🌐", label: "Multilateral" },
                            { icon: "🔬", label: "Life Sciences" },
                            { icon: "🤝", label: "Foundations" },
                        ].map((p) => (
                            <div className="v2-cta-partner-item" key={p.label}>
                                <div className="v2-cta-icon">{p.icon}</div>
                                <div className="v2-cta-label">{p.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="v2-cta-actions">
                        <a href="/contact" className="v2-btn-primary">Start a Conversation</a>
                        <a href="/publications" className="v2-btn-ghost">Explore Our Work</a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="v2-footer">
                <div className="v2-footer-left">
                    <a href="/" className="v2-logo"><span className="v2-logo-name">NADI</span></a>
                    <p>Network for Advancing Development &amp; Innovation in Health.<br />Part of Inke Maris &amp; Associates.</p>
                    <img src="/logo_IMA_white.png" alt="Inke Maris & Associates" style={{ maxWidth: 140, marginTop: "0.75rem", filter: "invert(1)", opacity: 0.6 }} />
                </div>
                <div className="v2-footer-right">
                    <p>Jl. KH Abdullah Syafi&apos;i No. 28<br />Jakarta 12840, Indonesia</p>
                </div>
            </footer>
            <div className="v2-footer-bottom">
                © 2026 NADI — Network for Advancing Development &amp; Innovation in Health
            </div>
        </div>
    );
}
