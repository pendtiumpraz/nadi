"use client";
import { useEffect, useRef } from "react";

const principles = [
    { num: "01", title: "Systems Orientation", text: "Health outcomes emerge from institutional interaction — not isolated interventions. We map the full ecosystem before recommending action." },
    { num: "02", title: "Empirical Discipline", text: "Recommendations are grounded in data, fiscal reality, and implementation evidence. Insight without evidence is advocacy; we hold a higher standard." },
    { num: "03", title: "Cross-Sector Perspective", text: "Public, private, academic, and development actors operate under distinct but interdependent incentive structures. We speak all these languages." },
    { num: "04", title: "Long-Term Institutional Thinking", text: "Short-term visibility must not undermine structural sustainability. Our work is designed to endure beyond any single program cycle." },
];

export default function Methodology() {
    const sectionRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.querySelectorAll(".animate-on-scroll").forEach((el, i) => setTimeout(() => el.classList.add("visible"), i * 120)); }); }, { threshold: 0.15 });
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="method" id="methodology" ref={sectionRef}>
            <div className="section-inner">
                <p className="section-label animate-on-scroll" style={{ color: "var(--crimson-mid)" }}>Methodological Approach</p>
                <h2 className="section-title animate-on-scroll" style={{ marginBottom: "1rem" }}>Four principles that <em>ground our work</em></h2>
                <p className="method-lead animate-on-scroll">Health systems rarely collapse due to a lack of intelligence. They falter due to misalignment between ambition and financing, between regulation and innovation, between stakeholders and system design. NADI works to restore alignment.</p>
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
