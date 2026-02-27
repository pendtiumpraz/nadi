const partners = [
    "Indonesian Ministry of Health", "Nanyang Technological University", "Carnegie Mellon University",
    "Monash University", "Institut Teknologi Bandung", "University of Pittsburgh",
    "Boston University School of Medicine", "UNICEF", "UnitedHealth Group",
    "Novo Nordisk", "Pfizer", "Biofarma", "Boston Children's Hospital",
    "International Vaccine Institute", "Alvarez & Marsal", "Maerki Baumann & Co.",
];

export default function Partners() {
    return (
        <section className="partners">
            <div className="section-inner">
                <p className="partners-label">Institutional Experience</p>
                <div className="marquee-track">
                    <div className="marquee-inner">
                        {partners.map((p) => (<div className="partner-chip" key={p}>{p}</div>))}
                        {partners.map((p) => (<div className="partner-chip" key={`dup-${p}`}>{p}</div>))}
                    </div>
                </div>
            </div>
        </section>
    );
}
