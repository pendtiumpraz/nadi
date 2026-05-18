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

  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255) DEFAULT '',
      bio TEXT DEFAULT '',
      initials VARCHAR(10) DEFAULT '',
      photo_url TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      order_num INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Seed default settings
  await sql`INSERT INTO site_settings (key, value) VALUES ('landing_version', 'v2') ON CONFLICT (key) DO NOTHING`;
  // Seed default notification CC list (Amira / Widyaretna / Soleh @inkemaris.com)
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('notification_cc', ${JSON.stringify([
        { name: "Amira", email: "amira.hn@inkemaris.com" },
        { name: "Widyaretna Buenastuti", email: "widyaretna.buenastuti@inkemaris.com" },
        { name: "Soleh Ayubi", email: "soleh.ayubi@inkemaris.com" },
    ])})
    ON CONFLICT (key) DO NOTHING
  `;

  // Add cover_image to articles if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // Add pdf_url to articles if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // Rename legacy categories: "STRATEGIC ANALYSIS" → "POLICY ANALYSIS", "WORKING PAPER" → "OPINION"
  await sql`UPDATE articles SET category = 'POLICY ANALYSIS' WHERE category = 'STRATEGIC ANALYSIS'`;
  await sql`UPDATE articles SET category = 'OPINION' WHERE category = 'WORKING PAPER'`;

  // Add keywords array to media if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE media ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // ── Phase 1: role management foundation ────────────────────────────
  // user activation status: pending → active → suspended
  await sql`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  // backfill existing users to active so they keep working after the migration
  await sql`UPDATE users SET status = 'active' WHERE status IS NULL OR status = '' OR status = 'pending'`;
  // legacy "user" role becomes "contributor"
  await sql`UPDATE users SET role = 'contributor' WHERE role = 'user'`;

  // publish workflow status on content tables
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE media ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  // Backfill legacy rows that were inserted before the column existed (NULL/empty → published).
  // Drafts and in_review rows have explicit values and are NOT touched.
  await sql`UPDATE articles SET status = 'published' WHERE status IS NULL OR status = ''`;
  await sql`UPDATE media SET status = 'published' WHERE status IS NULL OR status = ''`;
  // events already use `status` for lifecycle (upcoming/completed), so publish state lives on its own column
  await sql`
    DO $$ BEGIN
      ALTER TABLE events ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`UPDATE events SET publish_status = 'published' WHERE publish_status IS NULL OR publish_status = ''`;
  // events feedback_pending flag — mirrors articles.feedback_pending for the review workflow
  await sql`
    DO $$ BEGIN
      ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_pending BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  // optional: track who authored each piece (nullable so legacy rows pass)
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_id INTEGER;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE media ADD COLUMN IF NOT EXISTS author_id INTEGER;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE events ADD COLUMN IF NOT EXISTS author_id INTEGER;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // submission audit trail
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,         -- 'article' | 'media' | 'event'
      ref_slug VARCHAR(500) NOT NULL,
      author_id INTEGER,
      reviewer_id INTEGER,
      status VARCHAR(20) NOT NULL DEFAULT 'in_review',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // user lifecycle audit log
  await sql`
    CREATE TABLE IF NOT EXISTS user_events (
      id SERIAL PRIMARY KEY,
      actor_id INTEGER,
      target_user_id INTEGER,
      action VARCHAR(50) NOT NULL,
      meta JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // ── Phase A: comments + feedback_pending ───────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS article_comments (
      id            SERIAL PRIMARY KEY,
      article_slug  VARCHAR(500) NOT NULL,
      author_id     INTEGER NOT NULL,
      author_role   VARCHAR(20) NOT NULL,
      body          TEXT NOT NULL,
      section_anchor VARCHAR(100) DEFAULT NULL,
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS article_comments_slug_idx ON article_comments (article_slug, created_at DESC)`;
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS feedback_pending BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  // Mirror feedback_pending on media for the same partner-resubmit UX.
  await sql`
    DO $$ BEGIN
      ALTER TABLE media ADD COLUMN IF NOT EXISTS feedback_pending BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // ── Phase B: policy product type + AI / primary research flags ─────
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS policy_product_type VARCHAR(30);
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_disclosure TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS contains_primary_research BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;
  // Default ETA (days) for the auto-reply email on submission. Editable in /admin/settings.
  await sql`INSERT INTO site_settings (key, value) VALUES ('review_eta_days', '7') ON CONFLICT (key) DO NOTHING`;

  // ── Phase E: Privacy Policy popup tracking ─────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS privacy_consents (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER,
      client_token  VARCHAR(64) NOT NULL,
      ip_address    VARCHAR(100) DEFAULT '',
      accepted_at   TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS privacy_consents_token_idx ON privacy_consents (client_token)`;
  // Seed default Terms + Privacy body (admin can edit in /admin/settings).
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (
      'privacy_terms_md',
      ${"# Ketentuan Penggunaan & Kebijakan Privasi\n\nSelamat datang di NADI — Network for Advancing Development & Innovation in Health.\n\nDengan menggunakan situs ini, Anda menyetujui pengumpulan dan penggunaan data sebagaimana dijelaskan dalam Kebijakan Privasi kami. Kami menggunakan cookies untuk meningkatkan pengalaman Anda dan menganalisis traffic.\n\n## Ketentuan Penggunaan Layanan\n\nKonten di situs ini disediakan untuk tujuan informasi dan edukasi. Reproduksi atau distribusi memerlukan izin tertulis dari NADI.\n\n## Kebijakan Privasi\n\nKami mengumpulkan informasi minimal yang diperlukan untuk menjalankan situs (alamat IP, cookie sesi). Kami tidak menjual data Anda kepada pihak ketiga.\n\nTerakhir diperbarui: 2026."}
    )
    ON CONFLICT (key) DO NOTHING
  `;

  // ── Phase F: Policy product guideline file URL ─────────────────────
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES ('guideline_url', '')
    ON CONFLICT (key) DO NOTHING
  `;

  // ── Phase G: editor side panel — summary social (OG description) ───
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS summary_social TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // ── Security: AI usage tracking + limits ───────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS ai_calls (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER,
      endpoint      VARCHAR(50) NOT NULL,
      input_chars   INTEGER NOT NULL,
      called_at     TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ai_calls_user_idx ON ai_calls (user_id, called_at DESC)`;
  // Default AI limits (admin-configurable in /admin/settings).
  // - maxInputChars: hard reject any user prompt longer than this (anti-token-burn)
  // - maxOutputTokens: cap on the response size (passed to DeepSeek as max_tokens)
  // - perUserPerHour: rolling cap on total AI calls per user
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (
      'ai_limits',
      ${JSON.stringify({
          maxInputChars: 8000,
          maxOutputTokens: 4096,
          perUserPerHour: 30,
      })}
    )
    ON CONFLICT (key) DO NOTHING
  `;

  // ── Security: per-user submission cap (anti-spam) ──────────────────
  // Counts rows in the existing `submissions` table to throttle non-publishers.
  // Configurable in /admin/settings.
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (
      'submission_limits',
      ${JSON.stringify({ perDayPerUser: 5 })}
    )
    ON CONFLICT (key) DO NOTHING
  `;
  // Helps the daily-count query stay fast as the audit trail grows.
  await sql`CREATE INDEX IF NOT EXISTS submissions_author_created_idx ON submissions (author_id, created_at DESC)`;

  // ── Security: login attempt log + throttle settings ────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255) NOT NULL,
      ip_address    VARCHAR(100) DEFAULT '',
      success       BOOLEAN NOT NULL,
      attempted_at  TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, attempted_at DESC)`;
  // Default escalating lockout (configurable in /admin/settings).
  // After N failures within windowSeconds, the next sign-in attempt is blocked
  // for lockoutSeconds. The highest-N threshold matched wins.
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (
      'security_throttle',
      ${JSON.stringify({
          windowSeconds: 3600,
          thresholds: [
              { after: 3, lockoutSeconds: 30 },
              { after: 5, lockoutSeconds: 300 },
              { after: 10, lockoutSeconds: 3600 },
          ],
      })}
    )
    ON CONFLICT (key) DO NOTHING
  `;

  // ── Phase D: consent-to-publish form ───────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS article_consents (
      id                       SERIAL PRIMARY KEY,
      article_slug             VARCHAR(500) NOT NULL UNIQUE,
      title_of_paper           VARCHAR(500) NOT NULL,
      authors                  JSONB NOT NULL DEFAULT '[]',
      signatory_full_name      VARCHAR(255) NOT NULL,
      signatory_signature_url  TEXT DEFAULT '',
      signatory_date           DATE NOT NULL,
      ack_ethical              BOOLEAN NOT NULL,
      ack_original             BOOLEAN NOT NULL,
      ack_edited               BOOLEAN NOT NULL,
      ack_ai_disclosure        BOOLEAN NOT NULL,
      ack_may_reject           BOOLEAN NOT NULL,
      ack_no_liability         BOOLEAN NOT NULL,
      agree_on_behalf          BOOLEAN NOT NULL,
      created_at               TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    DO $$ BEGIN
      ALTER TABLE articles ADD COLUMN IF NOT EXISTS consent_id INTEGER;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // Add linkedin_url to team_members if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // Newsletter subscribers table
  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      ip_address VARCHAR(100) DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      subscribed_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add ip_address column if missing
  await sql`
    DO $$ BEGIN
      ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100) DEFAULT '';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$
  `;

  // ── Topic discussion thread (mirrors article_comments) ─────────────
  await sql`
    CREATE TABLE IF NOT EXISTS topic_messages (
      id SERIAL PRIMARY KEY,
      topic_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      author_role VARCHAR(20) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS topic_messages_topic_idx ON topic_messages (topic_id, created_at DESC)`;

  // ── In-app notifications (bell icon dropdown) ──────────────────────
  // Each row = a single notification for a specific user. The `link` is
  // where the bell dropdown sends them on click — usually an /admin URL.
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      body TEXT DEFAULT '',
      link VARCHAR(500) DEFAULT '',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications (user_id, is_read) WHERE is_read = false`;

  // ── Password reset tokens ──────────────────────────────────────────
  // Store only the sha256 of the random token (not the token itself) so a
  // database leak doesn't hand out free password resets. Token has a 1-hour
  // TTL and is single-use (used_at set when consumed).
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token_hash VARCHAR(128) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_hash_idx ON password_reset_tokens (token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id)`;
}
