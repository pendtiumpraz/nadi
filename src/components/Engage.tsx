"use client";
import { useEffect, useRef } from "react";

export default function Engage() {
    const sectionRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.querySelectorAll(".animate-on-scroll").forEach((el, i) => setTimeout(() => el.classList.add("visible"), i * 100)); }); }, { threshold: 0.15 });
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="engage" id="engage" ref={sectionRef}>
            <div className="section-inner">
                <div className="engage-grid">
                    <div>
                        <p className="section-label animate-on-scroll">Who We Engage</p>
                        <h2 className="section-title animate-on-scroll">Partners across every <em>sector</em> of the system</h2>
                        <ul className="engage-list">
                            <li className="animate-on-scroll">Government Ministries &amp; Public Institutions</li>
                            <li className="animate-on-scroll">Multilateral &amp; Global Health Organizations</li>
                            <li className="animate-on-scroll">Healthcare &amp; Life Sciences Companies</li>
                            <li className="animate-on-scroll">Philanthropic Foundations</li>
                            <li className="animate-on-scroll">Academic &amp; Research Institutions</li>
                            <li className="animate-on-scroll">Strategic Cross-Sector Alliances</li>
                        </ul>
                    </div>
                    <div className="engage-right animate-on-scroll">
                        <blockquote>&ldquo;NADI engages as an intellectual partner, a strategic advisor, and a structured convenor.&rdquo;</blockquote>
                        <p>We bring together the institutions whose cooperation is necessary for durable change — and design the frameworks that make that cooperation productive, accountable, and sustainable. Because a system without a coherent pulse cannot endure.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
