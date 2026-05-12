import type { Metadata } from "next";
import Providers from "@/components/Providers";
import PrivacyPopupGate from "@/components/PrivacyPopupGate";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase resolves relative URLs in OG/Twitter image tags. Without it,
  // social previews of articles whose coverImage is a relative path fail.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nadi-health.id"),
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
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://nadi-health.id",
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
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
        <Providers>
          {children}
          <PrivacyPopupGate />
        </Providers>
      </body>
    </html>
  );
}
