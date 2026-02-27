"use client";

import { useEffect, useRef } from "react";

export default function Philosophy() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target
                            .querySelectorAll(".animate-on-scroll")
                            .forEach((el, i) => {
                                setTimeout(() => el.classList.add("visible"), i * 150);
                            });
                    }
                });
            },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section className="philosophy" id="philosophy" ref={sectionRef}>
            <div className="section-inner">
                <p className="section-label animate-on-scroll" style={{ justifyContent: "center" }}>
                    Institutional Philosophy
                </p>
                <div className="philosophy-text animate-on-scroll">
                    <p>Health systems rarely collapse due to a lack of intelligence.</p>
                    <br />
                    <p>
                        They falter due to misalignment between <em>ambition and financing</em>,
                    </p>
                    <p>
                        between <em>regulation and innovation</em>,
                    </p>
                    <p>
                        between <em>stakeholders and system design</em>.
                    </p>
                    <br />
                    <p>NADI works to restore alignment.</p>
                </div>
                <p className="philosophy-closing animate-on-scroll">
                    Because a system without a coherent pulse cannot endure.
                </p>
            </div>
        </section>
    );
}
