"use client";

import { useEffect, useRef } from "react";

const principles = [
    {
        num: "01",
        title: "Systems Orientation",
        text: "Health outcomes emerge from institutional interaction — not isolated interventions.",
    },
    {
        num: "02",
        title: "Empirical Discipline",
        text: "Recommendations are grounded in data, fiscal reality, and implementation evidence.",
    },
    {
        num: "03",
        title: "Cross-Sector Perspective",
        text: "Public, private, academic, and development actors operate under distinct but interdependent incentive structures.",
    },
    {
        num: "04",
        title: "Long-Term Institutional Thinking",
        text: "Short-term visibility must not undermine structural sustainability.",
    },
];

export default function Methodology() {
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
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="method" id="methodology" ref={sectionRef}>
            <div className="section-inner">
                <p className="section-label animate-on-scroll">
                    Methodological Approach
                </p>
                <p className="method-lead animate-on-scroll">
                    NADI&rsquo;s work is grounded in four principles:
                </p>
                <div className="method-grid">
                    {principles.map((p) => (
                        <div className="method-card animate-on-scroll" key={p.num}>
                            <span className="method-card-num">{p.num}</span>
                            <div className="method-card-title">{p.title}</div>
                            <p className="method-card-text">{p.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
