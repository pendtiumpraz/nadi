"use client";

import { useEffect, useRef } from "react";

const areas = [
    {
        num: "01",
        title: "Public Affairs in Complex Healthcare Ecosystems",
        text: "Healthcare policy is shaped by regulatory evolution, fiscal constraints, innovation pipelines, demographic shifts, and geopolitical dynamics. We interpret institutional incentives, identify leverage points, and design coherent public affairs strategies anchored in evidence.",
        tags: [
            "Vaccine & Biologics Strategy",
            "Value-Based Care",
            "Health Financing",
            "Regulatory Landscape",
        ],
    },
    {
        num: "02",
        title: "Strategic Training & Institutional Literacy",
        text: "Complex systems require leaders who understand structure, incentives, and long-term implications. All programs are case-based, empirically grounded, and applicable to the targeted trainee. Some programs are designed specifically for senior decision-makers.",
        tags: [
            "Policy Architecture",
            "Systems Thinking",
            "Executive Programs",
            "Regulatory Governance",
        ],
    },
    {
        num: "03",
        title: "Governance & Project Management for Global Collaboration",
        text: "Global health initiatives often fail not because of weak ambition, but because of fragmented governance and misaligned incentives. We design governance structures, stakeholder coordination mechanisms, milestone discipline, and performance alignment frameworks.",
        tags: [
            "Multilateral Initiatives",
            "Pharma Collaboration",
            "Governance Frameworks",
            "Academic–Industry–Gov",
        ],
    },
    {
        num: "04",
        title: "Policy Design & Advocacy Architecture",
        text: "Policy design is fundamentally about structuring incentives, clarifying trade-offs, and ensuring sustainability. We integrate research rigor with institutional feasibility — from evidence-informed formulation to regulatory pathway analysis.",
        tags: [
            "Evidence-Based Policy",
            "Position Papers",
            "Advocacy Strategy",
            "Regulatory Pathways",
        ],
    },
];

export default function Areas() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll(".animate-on-scroll").forEach((el, i) => {
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
                        <p className="section-label animate-on-scroll">Core Areas of Work</p>
                        <h2 className="section-title animate-on-scroll">
                            Where NADI
                            <br />
                            <em>engages</em>
                        </h2>
                    </div>
                    <p className="areas-header-desc animate-on-scroll">
                        From regulatory strategy to governance design, NADI provides
                        structured analysis at every stage of health system
                        decision-making.
                    </p>
                </div>
                <div className="areas-grid">
                    {areas.map((area) => (
                        <div className="area-item animate-on-scroll" key={area.num}>
                            <span className="area-num">{area.num} —</span>
                            <h3 className="area-title">{area.title}</h3>
                            <p className="area-text">{area.text}</p>
                            <div className="area-tags">
                                {area.tags.map((tag) => (
                                    <span className="tag" key={tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
