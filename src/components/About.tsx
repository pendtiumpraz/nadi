"use client";
import { useEffect, useRef } from "react";

export default function About() {
    const sectionRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.querySelectorAll(".animate-on-scroll").forEach((el, i) => setTimeout(() => el.classList.add("visible"), i * 100)); }); }, { threshold: 0.15 });
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="about" id="about" ref={sectionRef}>
            <div className="section-inner">
                <div className="about-grid">
                    <div className="about-left">
                        <p className="section-label animate-on-scroll">About NADI</p>
                        <h2 className="section-title animate-on-scroll">A platform for strategic engagement at the <em>system level</em></h2>
                        <div className="about-quote animate-on-scroll">&ldquo;A health system&rsquo;s pulse is not technology alone, nor funding alone, nor regulation alone. It is the coherence between public affairs &amp; communication, policy, governance, and implementation.&rdquo;</div>
                        <p className="section-body animate-on-scroll">NADI is a research and policy institute dedicated to advancing systemic, evidence-informed solutions to complex healthcare challenges. Its core team brings cross-sector experience spanning academic institutions, multilateral and global health organizations, public–private healthcare ecosystems, and corporate healthcare environments.</p>
                        <br />
                        <p className="section-body animate-on-scroll">NADI is not a conventional firm focused solely on transactional deliverables. Nor is it an academic center detached from the realities of implementation. It is a platform for structured, strategic engagement at the system level.</p>
                    </div>
                    <div className="about-right">
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">◎</span>
                            <div className="about-card-title">Policy Must Be Rigorous</div>
                            <p className="about-card-text">Intellectually grounded, financially realistic, and politically feasible from conception to execution.</p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">⟁</span>
                            <div className="about-card-title">Operationally Executable</div>
                            <p className="about-card-text">Analysis serves action. Every recommendation must hold up against implementation reality.</p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">⊕</span>
                            <div className="about-card-title">Cross-Sector Depth</div>
                            <p className="about-card-text">Cross-sectoral, interdisciplinary, and multi-institutional collaboration enables the delivery of comprehensive and sustainable solutions.</p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">∿</span>
                            <div className="about-card-title">Long-Term Thinking</div>
                            <p className="about-card-text">Short-term visibility must never undermine structural sustainability of the systems we advise.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
