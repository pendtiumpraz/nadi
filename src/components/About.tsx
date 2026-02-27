"use client";

import { useEffect, useRef } from "react";

export default function About() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target
                            .querySelectorAll(".animate-on-scroll")
                            .forEach((el, i) => {
                                setTimeout(() => el.classList.add("visible"), i * 100);
                            });
                    }
                });
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="about" id="about" ref={sectionRef}>
            <div className="section-inner">
                <div className="about-grid">
                    <div className="about-left">
                        <p className="section-label animate-on-scroll">About NADI</p>
                        <h2 className="section-title animate-on-scroll">
                            NADI operates at the <em>intersection</em> of
                        </h2>

                        <ul className="about-list animate-on-scroll">
                            <li>Public affairs and regulatory strategy</li>
                            <li>Health systems governance</li>
                            <li>Global health collaboration</li>
                            <li>Institutional capability and policy design</li>
                        </ul>

                        <p className="section-body animate-on-scroll">
                            Its core team brings cross-sector experience spanning academic
                            institutions, public affairs firm, multilateral and global health
                            organizations, public–private healthcare ecosystems, and corporate
                            healthcare environments — including Inke Maris, the Indonesian
                            Ministry of Health, Nanyang Technological University, Carnegie
                            Mellon University, Monash University, Institut Teknologi Bandung,
                            University of Pittsburgh, Maerki Baumann &amp; Co. AG, Boston
                            University School of Medicine, Boston Children&rsquo;s Hospital,
                            the Pittsburgh Veterans Affairs Healthcare System, UnitedHealth
                            Group, Novo Nordisk, Biofarma, Pfizer, UNICEF, Alvarez &amp;
                            Marsal, and the International Vaccine Institute (IVI).
                        </p>

                        <div className="about-quote animate-on-scroll">
                            This background informs NADI&rsquo;s perspective: policy must be
                            intellectually rigorous, financially grounded, politically
                            feasible, and operationally executable.
                        </div>

                        <p className="section-body animate-on-scroll">
                            NADI is not a conventional consulting firm focused solely on
                            transactional deliverables. Nor is it an academic center detached
                            from the realities of implementation. It is a platform for
                            structured, strategic engagement at the system level.
                        </p>
                    </div>

                    <div className="about-right">
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">◎</span>
                            <div className="about-card-title">Intellectually Rigorous</div>
                            <p className="about-card-text">
                                Policy must be intellectually rigorous, financially grounded,
                                politically feasible, and operationally executable.
                            </p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">⟁</span>
                            <div className="about-card-title">Not a Consulting Firm</div>
                            <p className="about-card-text">
                                NADI is not a conventional consulting firm focused solely on
                                transactional deliverables.
                            </p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">⊕</span>
                            <div className="about-card-title">Not an Academic Center</div>
                            <p className="about-card-text">
                                Nor is it an academic center detached from the realities of
                                implementation.
                            </p>
                        </div>
                        <div className="about-card animate-on-scroll">
                            <span className="about-card-icon">∿</span>
                            <div className="about-card-title">System-Level Engagement</div>
                            <p className="about-card-text">
                                It is a platform for structured, strategic engagement at the
                                system level.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
