# NADI Platform — User Acceptance Testing (UAT)

Manual smoke-test scenarios you (or someone on the NADI team) can run from a browser. Each scenario is independent — start fresh between them if needed. Times in parentheses are estimates assuming SMTP is configured (otherwise notifications log to the dev console).

**Prerequisites**
- `/api/db/migrate` has been hit once on the target environment.
- The four seed accounts exist (password `Nadi@2025!`):
  - `admin@nadi-health.id` (admin)
  - `admin2@nadi-health.id` (admin backup)
  - `reviewer@nadi-health.id` (reviewer)
  - `contributor@nadi-health.id` (contributor)
  - `partner@nadi-health.id` (partner)
- SMTP env vars set (`SMTP_HOST/PORT/USER/PASS/FROM`) if real emails are required. Otherwise, watch the dev console for `[notify:...]` lines.

---

## Scenario 1 — Partner self-registration → admin activation (~3 min)

1. Open `/register` in an incognito window.
2. Fill name, email (use a real address you control), password.
3. Submit → expect "Registration received" success state.
4. Try to sign in immediately at `/login` with the new credentials.
5. **Expected**: "Account is pending admin approval" error.
6. In another tab, sign in as `admin@nadi-health.id` → go to `/admin/users`.
7. Filter chip **Pending** → expect to see the new account with count badge.
8. Click **Activate** → status pill becomes "Active".
9. New activation email logged / sent to the partner's address.
10. Sign in as the partner → should succeed and land on `/admin`.

✅ **Pass criteria**: blocked-then-allowed sign-in, audit row in `user_events`.

---

## Scenario 2 — End-to-end article publishing flow (~10 min)

Partner side:
1. Sign in as `contributor@nadi-health.id`.
2. Click **+ New Article** (or `/admin/articles/new`).
3. **PolicyProductPicker**: pick **Opinion Piece**.
4. Verify editor auto-seeds 5 sections (Opening / 3 Arguments / Closing).
5. Fill title (watch the **0/80** counter), edit each scaffold section with real-ish prose.
6. Tick all **3 Authorship & Research Integrity** checkboxes.
7. **AI Disclosure**: either tick "I did not use AI tools", or fill the textarea.
8. Sidebar (right panel) — confirm "Words ___ / 600–1,200" counter is live.
9. Click **Submit for Review** in the sticky side panel.
10. **Expected**: success toast; status pill flips to `in_review`; partner gets auto-reply email "Thank you for submitting your work. We will review your work and get back to you in 7 days"; admins + standing CC get notification.

Admin / reviewer side:
11. Sign in as `reviewer@nadi-health.id` in another browser/incognito.
12. Go to `/admin/review` → article appears in **Pending QC / Review** bucket.
13. Open the article — confirm comment thread is visible at bottom.
14. Post a comment "Please tighten the closing paragraph."
15. **Expected**: partner gets email "Your work has been reviewed. Please kindly proceed with the necessary revisions at your earliest convenience"; the article in admin's `/admin/articles` shows a 💬 indicator.

Partner revises:
16. Sign back in as partner → `/admin/articles` → click the article (it shows feedback-pending banner).
17. Read the comment, edit the prose, click **Submit for Review** again.
18. **Expected**: banner clears; admin + CC get another submission email.

Admin approves:
19. Reviewer in `/admin/review` → click **Approve**.
20. **Expected**: article moves to **Awaiting Consent Form** bucket; partner gets "Your work has been approved. Please kindly complete and submit the consent form for publication" email with a `/consent/[slug]?token=...` link.

Partner consents:
21. Open the consent-form URL in an incognito tab (no login needed — token-gated).
22. Confirm title is pre-filled; first author row pre-fills partner's name.
23. Tick 4 author declarations (items 1–4) — items 5–6 are locked-acknowledged with 🔒 icon.
24. Add affiliation, signatory name, upload a PNG/JPG signature, set date.
25. Tick effect-clause checkbox → **Submit Consent Form**.
26. **Expected**: redirect to `/consent/[slug]/done` thank-you; admins + CC get "Consent received" email; article moves to **Ready to Publish** bucket on `/admin/review`.

Admin publishes:
27. Click **Publish** in the Ready to Publish row (or open the article and click the crimson Publish button).
28. **Expected**: success toast with **View →** link; partner gets "Your article is now live" email; article appears on `/publications`.

✅ **Pass criteria**: status moved through all 5 states; 6 distinct emails fired in the right order; article visible on `/publications/[slug]` with cover image as hero background + summary_social as OG description in the page source (View Source → look for `<meta property="og:description"`).

---

## Scenario 3 — Privacy Policy popup (~2 min)

1. Open `/` in an incognito window.
2. **Expected**: popup appears centred (mobile: bottom sheet) with "Konfirmasi Ketentuan dan Kebijakan Privasi".
3. Click **Nanti Saja** → popup closes for this tab.
4. Open a new tab to `/publications` → popup re-appears.
5. Click **Setujui Semua** → popup closes; localStorage `privacy_ack` is set.
6. Reload → popup does NOT re-appear.
7. Visit `/admin/login` (admin login flow) or `/login` → popup does NOT appear.
8. Visit `/consent/anything?token=fake` → popup does NOT appear.
9. As admin, go to `/admin/settings` → edit "Privacy & Terms body (popup content)" markdown → save.
10. Clear `localStorage.privacy_ack` in DevTools → reload `/` → popup shows new body.

✅ **Pass criteria**: popup suppressed on `/admin`, `/login`, `/register`, `/consent/*`; editable from settings; doesn't re-show after accept.

---

## Scenario 4 — Login throttling (~3 min)

1. Open `/login` in an incognito window.
2. Type `admin@nadi-health.id` + wrong password — submit 3 times.
3. On the 4th attempt → **Expected**: "Too many failed attempts. Please wait 30 seconds before trying again."
4. Wait 30s → try again with wrong password → counter is still at 3; **next** failure (5th overall) → "wait 5 minutes".
5. Sign in as admin (different account, `admin2@nadi-health.id`, correct password) → `/admin/settings` → scroll to **Security — Login Throttle**.
6. Confirm "Last 24h: ___ failed login attempts" reflects your tests.
7. Edit one threshold (e.g. change "After 3 failures → 30s" to "5 failures → 60s"), Save.
8. Repeat step 1 → confirm new limits apply on next failure cycle.

✅ **Pass criteria**: escalating lockout works; admin can tune thresholds; counter visible.

---

## Scenario 5 — Upload validation (~5 min)

For each of the 4 upload endpoints, try uploading a **disallowed** file. Each should reject cleanly with a useful error, no file written.

1. **Cover image** (admin/articles/new → Cover Image): try `evil.php`, `evil.svg`, `image.exe`. All should reject. Then a real PNG → accepted.
2. **PDF document** (admin/articles editor → PDF section): try `script.html` or a 25 MB PDF. Reject. Real 1 MB PDF → accepted.
3. **Consent signature** (`/consent/[slug]?token=...` → upload signature field): try `.svg`. Reject. Real PNG → accepted.
4. **Policy guideline** (admin/guidelines, admin only): try `.txt` or `.zip`. Reject. PDF or DOCX → accepted.

✅ **Pass criteria**: every blocked extension surfaces "not allowed for security reasons" or "Only .X files are allowed"; no files written under `public/uploads/` for blocked uploads.

---

## Scenario 6 — Role gates / direct URL access (~5 min)

1. Sign in as `partner@nadi-health.id`.
2. Try each of these URLs directly:
   - `/admin/users` → expect redirect to `/admin`
   - `/admin/permissions` → redirect to `/admin`
   - `/admin/settings` → redirect to `/admin`
   - `/admin/team` → redirect to `/admin`
   - `/admin/media` → redirect to `/admin`
   - `/admin/events` → redirect to `/admin`
   - `/admin/newsletter` → redirect to `/admin`
   - `/admin/review` → redirect to `/admin`
   - `/admin/consents` → redirect to `/admin`
   - `/admin/guidelines` → redirect to `/admin`
3. Confirm the sidebar (`AdminNav`) only shows **Dashboard / Articles / Events / Docs** for partner.
4. Confirm `/admin/articles` shows **My Submissions** (only the partner's own articles).
5. As admin, go to `/admin/permissions` → toggle the contributor row to disable "ai" — Save.
6. Sign in as contributor → confirm "AI Writer" no longer appears in sidebar.

✅ **Pass criteria**: every protected page either redirects or 403s for partners; sidebar matrix updates take effect on next load.

---

## Scenario 7 — Resend consent link (~2 min)

1. Run Scenario 2 up to step 20 (article = `approved` state).
2. Sign in as reviewer → `/admin/review` → **Awaiting Consent Form** bucket → click **Resend Link**.
3. Confirm dialog → success toast "✓ Consent link re-sent to {partner email}".
4. Check partner's email — fresh `/consent/[slug]?token=...` with a new HMAC (the old link still works for 30 days unless TTL passed; both lead to the same form).

Alt path: as admin/reviewer, open the article in `/admin/articles/[slug]`. When status is `approved`, button **✉ Resend consent link** appears at the top.

✅ **Pass criteria**: new token sent; both links work until expiry.

---

## Scenario 8 — Public-facing surface (~3 min)

1. As admin, publish at least one article (Scenario 2).
2. Open `/publications` in incognito.
3. Confirm filter chips show **All / Opinion Piece / Policy Brief / Policy Paper**.
4. Click **Opinion Piece** → only opinion pieces in the list.
5. Cards show product-type label ("Opinion Piece"), cover thumbnail (if uploaded), date.
6. Open one article — header is either crimson/charcoal/dark solid OR uses coverImage as darkened hero.
7. View source (Ctrl+U):
   - `<meta property="og:description" content="...">` uses `summary_social` if set, else `seo.description`.
   - `<meta property="og:image" content="...">` is present iff coverImage exists.
   - `<meta name="robots" content="...">` allows index (since article is published).
8. Visit `/sitemap.xml` → confirm the article slug is listed; `/admin/*` and `/consent/*` are NOT.
9. Visit `/robots.txt` → confirm `Disallow: /admin/`, `/consent/`, `/login`, `/register`, `/api/`.

✅ **Pass criteria**: OG tags correct, filter works, sitemap clean.

---

## Scenario 9 — Notification CC list (~2 min)

1. As admin, `/admin/settings` → **Notification CC list**.
2. Default seeded: Amira / Widya / Soleh @inkemaris.com.
3. Add a 4th recipient → Save.
4. Submit a new article as contributor (Scenario 2 step 9) → confirm the 4th address is in the CC line of the admin-side submission email.
5. Remove the 4th → next submission omits it.

✅ **Pass criteria**: CC list edits take effect on the next email send.

---

## Scenario 10 — Audit trail (~2 min)

1. After running Scenarios 1–7, log into the Postgres console (Neon).
2. `SELECT action, count(*) FROM user_events GROUP BY action;` — should see `self_registered`, `status_active`, `created`, etc.
3. `SELECT type, ref_slug, status, count(*) FROM submissions GROUP BY type, ref_slug, status;` — should see article transitions for the slugs you touched.
4. `SELECT email, success, attempted_at FROM login_attempts ORDER BY attempted_at DESC LIMIT 20;` — recent sign-in attempts visible.
5. `SELECT article_slug, signatory_full_name, signatory_date FROM article_consents;` — consent rows for each scenario-2 publish.

✅ **Pass criteria**: every meaningful action wrote at least one audit row.

---

## Sign-off

When all 10 scenarios pass:
- File a 1-line note in `PROGRESS.md` under "Sign-off Checklist" (the existing section).
- Tag the release.
- Capture screenshots of the privacy popup, consent form, and `/admin/review` 3-bucket layout for the change-management deck.

If any scenario fails, file an issue with: scenario number, exact step that failed, the observed vs expected, and the relevant terminal log (search for `[notify:` lines in dev mode).
