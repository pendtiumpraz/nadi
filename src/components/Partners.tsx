"use client";

const partners = [
    "Indonesian Ministry of Health",
    "Nanyang Technological University",
    "Carnegie Mellon University",
    "Monash University",
    "Institut Teknologi Bandung",
    "University of Pittsburgh",
    "Boston University School of Medicine",
    "UNICEF",
    "UnitedHealth Group",
    "Novo Nordisk",
    "Pfizer",
    "Biofarma",
    "Boston Children's Hospital",
    "International Vaccine Institute",
    "Alvarez & Marsal",
    "Maerki Baumann & Co.",
    "Inke Maris",
];

export default function Partners() {
    // Duplicate list for seamless marquee loop
    const allPartners = [...partners, ...partners];

    return (
        <section className="partners">
            <div className="section-inner">
                <p className="partners-label">
                    Institutional Affiliations &amp; Partners
                </p>
                <div className="marquee-track">
                    <div className="marquee-inner">
                        {allPartners.map((name, i) => (
                            <div className="partner-chip" key={`${name}-${i}`}>
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
