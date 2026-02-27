"use client";

const partners = [
    "Indonesian Ministry of Health",
    "Inke Maris",
    "Nanyang Technological University",
    "Carnegie Mellon University",
    "Monash University",
    "Institut Teknologi Bandung",
    "University of Pittsburgh",
    "Maerki Baumann & Co. AG",
    "Boston University School of Medicine",
    "Boston Children's Hospital",
    "Pittsburgh Veterans Affairs Healthcare System",
    "UNICEF",
    "UnitedHealth Group",
    "Novo Nordisk",
    "Pfizer",
    "Biofarma",
    "International Vaccine Institute",
    "Alvarez & Marsal",
];

export default function Partners() {
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
