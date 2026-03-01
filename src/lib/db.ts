import { neon } from "@neondatabase/serverless";

// Get a SQL client
export function getDB() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  return neon(databaseUrl);
}

// ══════════════════════════════════════════
// Create tables
// ══════════════════════════════════════════
export async function migrate() {
  const sql = getDB();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(500) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      subtitle TEXT DEFAULT '',
      category VARCHAR(100) DEFAULT 'ARTICLE',
      date DATE DEFAULT CURRENT_DATE,
      read_time VARCHAR(50) DEFAULT '5 min read',
      author VARCHAR(255) DEFAULT 'NADI Research Team',
      cover_color VARCHAR(50) DEFAULT 'charcoal',
      seo_description TEXT DEFAULT '',
      seo_keywords TEXT[] DEFAULT '{}',
      blocks JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(500) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      date DATE DEFAULT CURRENT_DATE,
      time VARCHAR(100) DEFAULT '',
      location VARCHAR(500) DEFAULT '',
      location_type VARCHAR(50) DEFAULT 'onsite',
      category VARCHAR(100) DEFAULT 'seminar',
      image_url TEXT DEFAULT '',
      registration_url TEXT DEFAULT '',
      status VARCHAR(50) DEFAULT 'upcoming',
      speakers TEXT[] DEFAULT '{}',
      organizer VARCHAR(255) DEFAULT 'NADI',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS media (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(500) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      type VARCHAR(50) DEFAULT 'video',
      embed_url TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      date DATE DEFAULT CURRENT_DATE,
      duration VARCHAR(50) DEFAULT '',
      speakers TEXT[] DEFAULT '{}',
      category VARCHAR(100) DEFAULT 'Health Policy',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      category VARCHAR(100) DEFAULT '',
      focus_area VARCHAR(255) DEFAULT '',
      status VARCHAR(50) DEFAULT 'pending',
      article_slug VARCHAR(500) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add cover_image to articles if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
}
