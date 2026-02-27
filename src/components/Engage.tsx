"use client";

import { useEffect, useRef } from "react";

const engageList = [
    "Government ministries and public institutions",
    "Multilateral and global health organizations",
    "Healthcare and life sciences companies",
    "Philanthropic foundations",
    "Academic and research institutions",
    "Strategic cross-sector alliances",
];

export default function Engage() {
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
        <section className="engage" id="engage" ref={sectionRef}>
            <div className="section-inner">
                <div className="engage-grid">
                    <div>
                        <p className="section-label animate-on-scroll">Who We Engage</p>
                        <ul className="engage-list">
                            {engageList.map((item) => (
                                <li key={item} className="animate-on-scroll">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="engage-right animate-on-scroll">
                        <blockquote>
                            &ldquo;NADI engages as an intellectual partner, a strategic
                            advisor, and a structured convenor.&rdquo;
                        </blockquote>
                    </div>
                </div>
            </div>
        </section>
    );
}
