import type { Metadata } from "next";
import Providers from "@/components/Providers";
import PrivacyPopupGate from "@/components/PrivacyPopupGate";
import { getDB } from "@/lib/db";
import "./globals.css";

async function getFaviconUrl(): Promise<string> {
  try {
    const sql = getDB();
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'branding_favicon_url' LIMIT 1`;
    const v = rows[0]?.value as string | undefined;
    if (v && v.trim().length > 0) return v;
  } catch { /* fall through */ }
  return "/favicon-32.png";
}

export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = await getFaviconUrl();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nadi-health.id"),
    title: "NADI — Network for Advancing Development & Innovation in Health",
    description:
      "A Research & Policy Institute dedicated to advancing systemic, evidence-informed solutions to complex healthcare challenges. NADI works at the intersection of policy, financing, governance, and implementation.",
    keywords: [
      "NADI", "health policy", "research institute", "healthcare governance",
      "health systems", "policy design", "public affairs", "global health",
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
    robots: { index: true, follow: true },
    icons: {
      icon: [
        // Primary icon honours admin's branding setting; the larger PWA
        // sizes stay on the bundled files (admin-uploaded image is one
        // file, browsers down-scale fine).
        { url: faviconUrl, sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

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
