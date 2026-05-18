// Default stylized HTML for the public legal pages. These act as the seed
// content when the corresponding site_settings rows are still empty so the
// pages always render something professional even before an admin edits them.

export const DEFAULT_PRIVACY_POLICY_HTML = `
<section id="summary">
<h2>1. Summary</h2>
<p>NADI (Network for Advancing Development &amp; Innovation in Health) takes the privacy of every visitor, contributor, and partner interacting with the platform seriously. This page explains, in plain language, what data we collect, why we keep it, and the rights you hold over that data.</p>
<div class="legal-callout">
  <p><strong>The short version:</strong> we only collect what we need to run the platform, we never sell your data to third parties, and you can ask for your data to be deleted at any time.</p>
</div>
</section>

<section id="data-we-collect">
<h2>2. Data We Collect</h2>
<p>The data we hold depends on how you use NADI:</p>
<ol class="legal-list">
  <li><strong>Public visitors</strong> — anonymised access logs (IP address, user-agent, the pages you opened) for analytics and security.</li>
  <li><strong>Newsletter subscribers</strong> — email address, subscription date, and the IP recorded at sign-up to prevent spam.</li>
  <li><strong>Registered contributors</strong> — full name, email, bcrypt-hashed password, role, and the activity trail tied to your account (articles you authored, comments, status transitions).</li>
  <li><strong>Consent-to-publish signatures</strong> — when you sign the consent form, we store the signature image, full name, date, and affiliation details exactly as submitted.</li>
  <li><strong>Direct communications</strong> — contact-form submissions, comment replies, and emails you send to the NADI team.</li>
</ol>
</section>

<section id="how-we-use-data">
<h2>3. How We Use Your Data</h2>
<p>Your data is only used to:</p>
<ul class="legal-list">
  <li>Operate the NADI platform — authentication, article management, and the review workflow.</li>
  <li>Send relevant notifications: registration confirmation, review feedback, approval to publish, and important platform announcements.</li>
  <li>Publish your policy product on your behalf — strictly within the scope of the consent form you signed.</li>
  <li>Investigate security incidents and prevent abuse of the platform.</li>
  <li>Improve service quality through aggregate statistics that do not identify individual users.</li>
</ul>
</section>

<section id="storage">
<h2>4. Storage &amp; Security</h2>
<p>Data is stored on cloud infrastructure managed by trusted providers. Passwords are never stored in plaintext — they're hashed with bcrypt. Access to the production database is restricted to admins on a need-to-know basis and recorded in an internal audit log.</p>
<p>Daily backups are taken and kept encrypted for thirty days. Any security incident affecting user data is reported within 72 hours in line with GDPR-style standards.</p>
</section>

<section id="sharing">
<h2>5. Sharing With Third Parties</h2>
<p>We <strong>do not sell</strong> personal data to anyone. Data is only shared with:</p>
<ul class="legal-list">
  <li>Cloud infrastructure providers (database, file storage, email delivery) bound by confidentiality contracts.</li>
  <li>Legal authorities when required by a court order or applicable Indonesian law.</li>
  <li>The public — limited to content you've explicitly approved for publication via the consent form.</li>
</ul>
</section>

<section id="cookies">
<h2>6. Cookies &amp; Tracking</h2>
<p>We use technical cookies to keep your session active and store preferences (e.g. admin display mode, privacy-popup state). We do not use third-party advertising cookies. You can clear these cookies at any time through your browser; the trade-off is that you'll be signed out of any active sessions.</p>
</section>

<section id="your-rights">
<h2>7. Your Rights</h2>
<p>As a NADI user you have the right to:</p>
<ul class="legal-list">
  <li><strong>Access</strong> the personal data we hold about you.</li>
  <li><strong>Correct</strong> inaccurate data through your profile or by contacting the NADI team.</li>
  <li><strong>Delete</strong> your account and the data tied to it — except for content already published with your prior consent.</li>
  <li><strong>Restrict</strong> processing by temporarily deactivating your account.</li>
  <li><strong>Port</strong> your data to another service in a portable JSON / CSV export.</li>
</ul>
<p>Requests can be submitted to <a href="mailto:info@nadi-health.id">info@nadi-health.id</a> and will be processed within fourteen business days.</p>
</section>

<section id="minors">
<h2>8. Users Under Eighteen</h2>
<p>NADI is intended for users aged eighteen and over. We do not knowingly collect data from anyone under that age. If we discover such data, the related account is removed immediately.</p>
</section>

<section id="changes">
<h2>9. Changes to This Policy</h2>
<p>This policy may be updated as the service evolves or regulations change. Material changes are communicated to registered users via email and shown on the dashboard at the first sign-in after the update.</p>
</section>

<section id="contact">
<h2>10. Contact</h2>
<p>Questions about this privacy policy can be sent to:</p>
<ul class="legal-list">
  <li>Email: <a href="mailto:info@nadi-health.id">info@nadi-health.id</a></li>
  <li>Post: Jl. KH Abdullah Syafi'i No. 28, Jakarta 12840, Indonesia</li>
</ul>
</section>
`.trim();

export const DEFAULT_TERMS_OF_SERVICE_HTML = `
<section id="acceptance">
<h2>1. Acceptance of Terms</h2>
<p>By accessing or using the NADI platform (the "Service"), you agree to be bound by these Terms of Service and the applicable privacy policy. If you do not accept these terms, please do not use the Service.</p>
<div class="legal-callout">
  <p><strong>Notice:</strong> these terms form a binding legal agreement between you and NADI as the provider of the Service.</p>
</div>
</section>

<section id="definitions">
<h2>2. Definitions</h2>
<ul class="legal-list">
  <li><strong>NADI</strong> — Network for Advancing Development &amp; Innovation in Health, a research and policy-publication platform focused on health systems.</li>
  <li><strong>User</strong> — anyone accessing the Service, whether as a visitor, contributor, reviewer, or admin.</li>
  <li><strong>Content</strong> — every piece of material published through the Service, including policy products, events, media, and comments.</li>
  <li><strong>Policy Product</strong> — a written output such as a Policy Brief, Policy Paper, or Opinion Piece published via NADI.</li>
</ul>
</section>

<section id="accounts">
<h2>3. User Accounts</h2>
<p>To become a contributor you must register through the public sign-up page. By registering you confirm that:</p>
<ol class="legal-list">
  <li>The information you provide is true and accurate.</li>
  <li>You are at least eighteen years old or otherwise legally capable of entering into this agreement.</li>
  <li>You are responsible for the confidentiality of your login credentials and for everything that happens under your account.</li>
  <li>You will notify the NADI team immediately if your account is accessed without your permission.</li>
</ol>
<p>NADI reserves the right to refuse, suspend, or remove any account that violates these terms without prior notice.</p>
</section>

<section id="intellectual-property">
<h2>4. Intellectual Property</h2>
<p>Ownership of published content remains with the original author. By signing the publication consent form, however, you grant NADI a non-exclusive, perpetual, royalty-free licence to:</p>
<ul class="legal-list">
  <li>Publish and distribute the content through the NADI platform and other official NADI channels.</li>
  <li>Reproduce, archive, and translate the content for documentation purposes.</li>
  <li>Quote portions of the content in promotional or derivative material, with appropriate attribution.</li>
</ul>
<p>The NADI logo, name, and visual identity are owned by NADI and may not be used without written permission.</p>
</section>

<section id="content-standards">
<h2>5. Content Standards</h2>
<p>Content submitted for publication must meet the following standards:</p>
<ol class="legal-list">
  <li>Original and free of plagiarism.</li>
  <li>Developed ethically and in line with the code of scientific research ethics.</li>
  <li>Free of discrimination, hate speech, defamation, and any other unlawful material.</li>
  <li>Transparent about the use of AI tools through the AI Disclosure field at submission.</li>
  <li>Reviewed and revised in response to feedback from the NADI Quality Control team.</li>
</ol>
<p>NADI may reject, request revisions to, or withdraw content that fails to meet these standards.</p>
</section>

<section id="prohibited-conduct">
<h2>6. Prohibited Conduct</h2>
<p>Users must not:</p>
<ul class="legal-list">
  <li>Use the Service for unlawful purposes or to infringe the rights of others.</li>
  <li>Upload malware, attempt to bypass authentication, or perform denial-of-service attacks.</li>
  <li>Create fake accounts, impersonate others, or misuse another user's account.</li>
  <li>Bulk-extract data from the Service using automated tools without written permission.</li>
  <li>Redistribute content published on NADI without proper attribution.</li>
</ul>
</section>

<section id="liability">
<h2>7. Limitation of Liability</h2>
<p>NADI provides the Service "as is". We work hard to keep the Service reliable and secure, but we do not warrant that it will always be available or free of errors.</p>
<p>NADI is not responsible for:</p>
<ul class="legal-list">
  <li>The accuracy, completeness, or opinions contained in policy products — those remain the author's responsibility.</li>
  <li>Indirect, incidental, or consequential losses arising from your use of the Service.</li>
  <li>Actions of third parties who interact with published content.</li>
</ul>
</section>

<section id="termination">
<h2>8. Termination</h2>
<p>You can stop using the Service at any time by deleting your account from the dashboard or contacting the NADI team. NADI may suspend or terminate your access if:</p>
<ul class="legal-list">
  <li>You breach these terms.</li>
  <li>Your account's activity endangers the Service or other users.</li>
  <li>NADI decides to discontinue the Service.</li>
</ul>
</section>

<section id="governing-law">
<h2>9. Governing Law</h2>
<p>These Terms are governed by and interpreted under the laws of the Republic of Indonesia. Any dispute is first to be resolved by mutual discussion; failing that, it will be submitted to the District Court of South Jakarta.</p>
</section>

<section id="changes-tos">
<h2>10. Changes to These Terms</h2>
<p>NADI may update these Terms from time to time. Material changes are announced via email and surfaced on the dashboard at the first sign-in after the update. Continued use of the Service after a change indicates acceptance of the new terms.</p>
</section>

<section id="contact-tos">
<h2>11. Contact</h2>
<p>Questions, clarifications, or requests related to these terms can be sent to:</p>
<ul class="legal-list">
  <li>Email: <a href="mailto:info@nadi-health.id">info@nadi-health.id</a></li>
  <li>Post: Jl. KH Abdullah Syafi'i No. 28, Jakarta 12840, Indonesia</li>
</ul>
</section>
`.trim();
