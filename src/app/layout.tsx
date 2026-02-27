import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NADI — Network for Advancing Development & Innovation in Health",
  description:
    "A Research & Policy Institute dedicated to advancing systemic, evidence-informed solutions to complex healthcare challenges. NADI works at the intersection of policy, financing, governance, and implementation.",
  keywords: [
    "NADI",
    "health policy",
    "research institute",
    "healthcare governance",
    "health systems",
    "policy design",
    "public affairs",
    "global health",
  ],
  authors: [{ name: "NADI" }],
  openGraph: {
    title: "NADI — Institutional Thinking for Complex Health Systems",
    description:
      "A Research & Policy Institute dedicated to advancing systemic, evidence-informed solutions to complex healthcare challenges.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://nadi.com",
    siteName: "NADI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NADI — Institutional Thinking for Complex Health Systems",
    description:
      "A Research & Policy Institute dedicated to advancing systemic, evidence-informed solutions to complex healthcare challenges.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
