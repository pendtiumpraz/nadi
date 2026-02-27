"use client";

import { useEffect, useRef } from "react";

const insights = [
    {
        category: "Policy Analysis",
        title:
            "Rethinking Health Financing Sustainability in Post-Pandemic Indonesia",
        excerpt:
            "As Indonesia navigates a post-pandemic fiscal landscape, the sustainability of BPJS Kesehatan and national health expenditure has become a critical policy question. This analysis examines the structural tensions between universal coverage ambitions and fiscal reality, and proposes a framework for long-term sustainability grounded in empirical evidence and political feasibility.",
        date: "February 2026",
        type: "Policy Brief",
        imgText: "NADI",
        imgRed: true,
    },
    {
        category: "Governance",
        title:
            "When Public-Private Partnerships Fail: A Diagnostic Framework",
        excerpt:
            "Misaligned incentives, not bad intentions, drive most PPP breakdowns in global health.",
        date: "January 2026",
        type: "Working Paper",
        imgText: "PPP",
        imgRed: false,
    },
    {
        category: "Epidemiology & Policy",
        title:
            "Indonesia's Tuberculosis Challenge: A Systems Perspective",
        excerpt:
            "TB persists not due to lack of tools, but failure of system alignment across diagnosis, treatment, and prevention.",
        date: "December 2025",
        type: "Research Note",
        imgText: "TB",
        imgRed: true,
        imgSmall: true,
    },
];

export default function Insights() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll(".animate-on-scroll").forEach((el, i) => {
                            setTimeout(() => el.classList.add("visible"), i * 150);
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
        <section className="insights" id="insights" ref={sectionRef}>
            <div className="section-inner">
                <div className="insights-header">
                    <div>
                        <p className="section-label animate-on-scroll">
                            Insights &amp; Publications
                        </p>
                        <h2 className="section-title animate-on-scroll">
                            Latest <em>thinking</em>
                        </h2>
                    </div>
                    <a href="#" className="link-text animate-on-scroll">
                        View All Publications →
                    </a>
                </div>
                <div className="insights-grid">
                    {insights.map((item, idx) => (
                        <div className="insight-card animate-on-scroll" key={idx}>
                            <div className="insight-card-img">
                                <div
                                    className={`insight-card-img-inner${item.imgRed ? " red" : ""}`}
                                    style={item.imgSmall ? { fontSize: "1.8rem" } : undefined}
                                >
                                    {item.imgText}
                                </div>
                            </div>
                            <div className="insight-card-body">
                                <p className="insight-category">{item.category}</p>
                                <h3 className="insight-title">{item.title}</h3>
                                <p className="insight-excerpt">{item.excerpt}</p>
                            </div>
                            <div className="insight-footer">
                                <span>{item.date}</span>
                                <span>{item.type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
