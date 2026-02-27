"use client";

import { useEffect, useRef } from "react";

const areas = [
    {
        num: "01",
        title: "Public Affairs in Complex Healthcare Ecosystems",
        intro:
            "Healthcare policy is shaped by regulatory evolution, fiscal constraints, innovation pipelines, demographic shifts, and geopolitical dynamics.",
        serviceIntro: "NADI provides structured analysis and advisory services in:",
        services: [
            "Vaccine and biologics ecosystem strategy",
            "Preventive and value-based care transformation",
            "Health financing sustainability",
            "Stakeholder and regulatory landscape mapping",
            "Strategic positioning within highly regulated environments",
        ],
        outro:
            "We interpret institutional incentives, identify leverage points, and design coherent public affairs strategies anchored in evidence.",
    },
    {
        num: "02",
        title: "Strategic Training & Institutional Literacy",
        intro:
            "Complex systems require leaders who understand structure, incentives, and long-term implications.",
        serviceIntro: "NADI develops executive and institutional programs on:",
        services: [
            "Health policy architecture and regulatory governance",
            "Public affairs in life sciences and healthcare",
            "Systems thinking in global health",
            "Financing and sustainability in preventive care",
            "Strategic decision-making under regulatory and political constraints",
        ],
        outro:
            "All programs are case-based, empirically grounded, and applicable to the targeted trainee. Some of the programs are also designed specifically for senior decision-makers.",
    },
    {
        num: "03",
        title: "Governance & Project Management for Global Collaboration",
        intro:
            "Global health initiatives often fail not because of weak ambition, but because of fragmented governance and misaligned incentives.",
        serviceIntro: "NADI supports:",
        services: [
            "Multilateral and bilateral health initiatives",
            "Cross-border vaccine and pharmaceutical collaboration",
            "Academic–industry–government partnerships",
            "Development- and philanthropy-funded health programs",
        ],
        outro:
            "We design governance structures, stakeholder coordination mechanisms, milestone discipline, and performance alignment frameworks. Execution discipline is a precondition of credibility.",
    },
    {
        num: "04",
        title: "Policy Design & Advocacy Architecture",
        intro:
            "Policy design is fundamentally about structuring incentives, clarifying trade-offs, and ensuring sustainability.",
        serviceIntro: "NADI provides:",
        services: [
            "Evidence-informed policy formulation",
            "Strategic briefs and institutional position papers",
            "Stakeholder consultation and consensus-building design",
            "Advocacy strategy architecture",
            "Regulatory pathway analysis",
        ],
        outro: "We integrate research rigor with institutional feasibility.",
    },
];

export default function Areas() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target
                            .querySelectorAll(".animate-on-scroll")
                            .forEach((el, i) => {
                                setTimeout(() => el.classList.add("visible"), i * 120);
                            });
                    }
                });
            },
            { threshold: 0.1 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="areas" id="areas" ref={sectionRef}>
            <div className="section-inner">
                <div className="areas-header">
                    <div>
                        <p className="section-label animate-on-scroll">
                            Core Areas of Work
                        </p>
                    </div>
                </div>
                <div className="areas-grid">
                    {areas.map((area) => (
                        <div className="area-item animate-on-scroll" key={area.num}>
                            <span className="area-num">{area.num} —</span>
                            <h3 className="area-title">{area.title}</h3>
                            <p className="area-text">{area.intro}</p>
                            <p className="area-text" style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
                                {area.serviceIntro}
                            </p>
                            <ul className="area-services">
                                {area.services.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                            <p className="area-text">{area.outro}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
