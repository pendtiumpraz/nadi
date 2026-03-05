import { getDB } from "@/lib/db";
import LandingSwitcher from "@/components/LandingSwitcher";
import "./landing-v2.css";

async function getLandingVersion(): Promise<string> {
  try {
    const sql = getDB();
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'landing_version'`;
    return rows.length > 0 ? (rows[0].value as string) : "v2";
  } catch {
    return "v2";
  }
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const version = await getLandingVersion();
  return <LandingSwitcher version={version} />;
}
