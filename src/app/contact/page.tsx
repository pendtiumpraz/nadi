import type { Metadata } from "next";
import ContactPageClient from "@/components/ContactPageClient";

export const metadata: Metadata = {
    title: "Contact — NADI Research & Policy Institute",
    description: "Get in touch with NADI for institutional partnership, advisory engagement, or collaborative inquiry.",
};

export default function ContactPage() {
    return <ContactPageClient />;
}
