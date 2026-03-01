import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Contact — NADI Research & Policy Institute",
    description:
        "Get in touch with NADI for institutional partnership, advisory engagement, or collaborative inquiry.",
};

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <main>
                <section className="contact-page" id="contact-form">
                    <div className="section-inner">
                        <div className="contact-grid">
                            <div className="contact-info">
                                <p className="section-label">Get in Touch</p>
                                <h1 className="section-title">
                                    Let&rsquo;s start a <em>conversation</em>
                                </h1>
                                <p className="section-body" style={{ marginTop: "1.5rem" }}>
                                    For institutional partnership, advisory engagement, or
                                    collaborative inquiry — we welcome your message.
                                </p>

                                <div className="contact-details">
                                    <div className="contact-detail-item">
                                        <span className="contact-detail-icon">✉</span>
                                        <div>
                                            <p className="contact-detail-label">Email</p>
                                            <p className="contact-detail-value">info@nadi-health.id</p>
                                        </div>
                                    </div>
                                    <div className="contact-detail-item">
                                        <span className="contact-detail-icon">🌐</span>
                                        <div>
                                            <p className="contact-detail-label">Website</p>
                                            <p className="contact-detail-value">www.nadi-health.id</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="contact-engage-types">
                                    <h3>Types of Engagement</h3>
                                    <ul>
                                        <li>Institutional Partnership</li>
                                        <li>Advisory Engagement</li>
                                        <li>Collaborative Inquiry</li>
                                        <li>Media &amp; Press</li>
                                        <li>Join the Team</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="contact-form-wrapper">
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
