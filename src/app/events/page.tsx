import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventsListPublic from "@/components/EventsListPublic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Events — NADI Research & Policy Institute",
    description: "Conferences, seminars, workshops, and roundtables on health policy, governance, and institutional development.",
};

export default function EventsPage() {
    return (
        <>
            <Navbar />
            <main>
                <section className="publications-page">
                    <div className="section-inner">
                        <p className="section-label">Events</p>
                        <h1 className="section-title">
                            Conferences, seminars &amp; workshops
                        </h1>
                        <EventsListPublic />
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
