import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDocsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "admin";

    return (
        <div className="admin-content admin-content--wide">
            <div className="admin-content-header" style={{ marginBottom: "2rem" }}>
                <div>
                    <h1 className="admin-page-title">Documentation</h1>
                    <p className="admin-page-desc">Panduan lengkap semua fitur NADI CMS — cara penggunaan, tips, dan troubleshooting.</p>
                </div>
            </div>

            {/* Table of Contents */}
            <div className="docs-toc">
                <div className="docs-toc-title">📑 Daftar Isi</div>
                <div className="docs-toc-grid">
                    <a href="#dashboard" className="docs-toc-item">
                        <span className="docs-toc-icon">⊞</span>
                        <span>Dashboard</span>
                    </a>
                    <a href="#articles" className="docs-toc-item">
                        <span className="docs-toc-icon">✎</span>
                        <span>Articles & PDF Upload</span>
                    </a>
                    <a href="#events" className="docs-toc-item">
                        <span className="docs-toc-icon">◈</span>
                        <span>Events</span>
                    </a>
                    <a href="#media" className="docs-toc-item">
                        <span className="docs-toc-icon">▶</span>
                        <span>Media</span>
                    </a>
                    <a href="#team" className="docs-toc-item">
                        <span className="docs-toc-icon">◉</span>
                        <span>Team Members</span>
                    </a>
                    <a href="#newsletter" className="docs-toc-item">
                        <span className="docs-toc-icon">✉</span>
                        <span>Newsletter</span>
                    </a>
                    <a href="#ai" className="docs-toc-item">
                        <span className="docs-toc-icon">✦</span>
                        <span>AI Writer</span>
                    </a>
                    <a href="#settings" className="docs-toc-item">
                        <span className="docs-toc-icon">⚙</span>
                        <span>Settings</span>
                    </a>
                    {isAdmin && (
                        <a href="#users" className="docs-toc-item docs-toc-item--admin">
                            <span className="docs-toc-icon">⊕</span>
                            <span>User Management</span>
                        </a>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* DASHBOARD */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="dashboard">
                <div className="docs-section-header">
                    <span className="docs-section-icon">⊞</span>
                    <h2 className="docs-section-title">Dashboard</h2>
                </div>
                <div className="docs-card">
                    <h3>Apa itu Dashboard?</h3>
                    <p>
                        Dashboard adalah halaman utama setelah login. Di sini Anda bisa melihat ringkasan status website secara keseluruhan —
                        jumlah artikel yang dipublikasikan, jumlah subscriber newsletter yang aktif, dan level akses Anda.
                    </p>

                    <h3>Fitur di Dashboard</h3>
                    <div className="docs-feature-list">
                        <div className="docs-feature">
                            <div className="docs-feature-title">📊 Statistik</div>
                            <div className="docs-feature-desc">Menampilkan total artikel, subscriber aktif, dan level akses (Full untuk admin, Write untuk editor).</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">⚡ Quick Actions</div>
                            <div className="docs-feature-desc">Tombol jalan pintas untuk membuat artikel baru, melihat daftar subscriber, mengelola user (admin only), dan membuka website publik.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">📰 Latest Publication</div>
                            <div className="docs-feature-desc">Menampilkan artikel terbaru yang dipublikasikan beserta metadata-nya. Klik untuk langsung mengedit.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* ARTICLES & PDF */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="articles">
                <div className="docs-section-header">
                    <span className="docs-section-icon">✎</span>
                    <h2 className="docs-section-title">Articles & PDF Upload</h2>
                </div>
                <div className="docs-card">
                    <h3>Mengelola Publikasi</h3>
                    <p>
                        Halaman <strong>Articles</strong> adalah pusat pengelolaan semua publikasi NADI — mulai dari Policy Briefs, Research Papers,
                        Strategic Analysis, hingga Working Papers. Setiap artikel mendukung format layout yang elegan seperti majalah.
                    </p>

                    <h3>Cara Membuat Artikel Baru</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>
                                <strong>Klik &quot;+ New Article&quot;</strong> di halaman Articles, atau gunakan Quick Action di Dashboard.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>
                                <strong>Isi metadata artikel:</strong> Title (judul), Subtitle (sub-judul), Category (pilih tipe publikasi),
                                Author (penulis), Read Time (estimasi waktu baca), dan Cover Color.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>
                                <strong>Upload Cover Image</strong> (opsional) — klik atau drag-and-drop gambar sebagai sampul. Maks. 5MB.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">4</span>
                            <div>
                                <strong>Upload PDF Document</strong> (opsional) — jika artikel memiliki versi PDF lengkap. Maks. 20MB.
                                File PDF akan disimpan ke Vercel Blob Storage dan otomatis ditampilkan sebagai embedded viewer di halaman publikasi.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">5</span>
                            <div>
                                <strong>Tulis konten</strong> — gunakan editor rich text. Format teks menggunakan toolbar (Bold, Italic, Heading, List, Quote, dll).
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">6</span>
                            <div>
                                <strong>SEO</strong> — isi Description dan Keywords agar artikel lebih mudah ditemukan di mesin pencari.
                                Kosongkan untuk menggunakan auto-generate dari konten.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">7</span>
                            <div>
                                <strong>Simpan</strong> — klik &quot;Save Article&quot;. Artikel langsung tampil di halaman publik /publications.
                            </div>
                        </div>
                    </div>

                    <div className="docs-callout docs-callout--info">
                        <div className="docs-callout-title">📄 Tentang Fitur PDF</div>
                        <p>
                            Ketika sebuah artikel memiliki PDF, halaman publikasi akan menampilkan:
                        </p>
                        <ul>
                            <li><strong>Badge &quot;📄 PDF&quot;</strong> di daftar publikasi dan header artikel.</li>
                            <li><strong>Embedded PDF Viewer</strong> di bawah konten — pengunjung bisa scroll, zoom, dan membaca langsung di browser.</li>
                            <li><strong>Tombol &quot;Buka di Tab Baru&quot;</strong> — untuk membaca fullscreen atau download.</li>
                        </ul>
                    </div>

                    <h3>Mengedit &amp; Menghapus Artikel</h3>
                    <p>
                        Di halaman Articles, setiap artikel memiliki tombol <strong>Edit</strong> dan <strong>Delete</strong>.
                        Klik Edit untuk masuk ke editor, ubah isi atau metadata, lalu Save. Tombol Delete akan menghapus artikel secara permanen.
                    </p>

                    <div className="docs-callout docs-callout--warning">
                        <div className="docs-callout-title">⚠ Perhatian</div>
                        <p>Menghapus artikel bersifat <strong>permanen</strong> dan tidak bisa di-undo. Pastikan Anda yakin sebelum menghapus.</p>
                    </div>

                    <h3>Kategori Artikel yang Tersedia</h3>
                    <div className="docs-tags">
                        <span className="docs-tag">POLICY BRIEF</span>
                        <span className="docs-tag">RESEARCH PAPER</span>
                        <span className="docs-tag">STRATEGIC ANALYSIS</span>
                        <span className="docs-tag">WORKING PAPER</span>
                        <span className="docs-tag">RESEARCH NOTE</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* EVENTS */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="events">
                <div className="docs-section-header">
                    <span className="docs-section-icon">◈</span>
                    <h2 className="docs-section-title">Events</h2>
                </div>
                <div className="docs-card">
                    <h3>Mengelola Event</h3>
                    <p>
                        Halaman Events berfungsi untuk menambah, mengedit, dan menghapus acara yang diselenggarakan NADI,
                        seperti seminar, webinar, konferensi, dan workshop.
                    </p>

                    <h3>Cara Menambah Event</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>Klik <strong>&quot;+ New Event&quot;</strong> di halaman Events.</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>Isi semua field: <strong>Title, Date, Location, Location Type</strong> (online/offline), <strong>Category, Status</strong> (upcoming/completed), dan <strong>Description</strong>.</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>Upload gambar event jika ada, lalu <strong>Save</strong>.</div>
                        </div>
                    </div>

                    <h3>Status Event</h3>
                    <div className="docs-tags">
                        <span className="docs-tag docs-tag--green">Upcoming</span>
                        <span className="docs-tag docs-tag--muted">Completed</span>
                    </div>
                    <p style={{ marginTop: "0.75rem" }}>
                        Event dengan status <strong>Upcoming</strong> akan ditampilkan prominently di halaman publik /events.
                        Setelah event selesai, ubah statusnya ke <strong>Completed</strong>.
                    </p>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* MEDIA */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="media">
                <div className="docs-section-header">
                    <span className="docs-section-icon">▶</span>
                    <h2 className="docs-section-title">Media</h2>
                </div>
                <div className="docs-card">
                    <h3>Mengelola Konten Media</h3>
                    <p>
                        Halaman Media untuk mengelola konten multimedia NADI — video, podcast, webinar recordings, interview, dan panel discussion.
                    </p>

                    <h3>Tipe Media yang Didukung</h3>
                    <div className="docs-tags">
                        <span className="docs-tag">🎬 Video</span>
                        <span className="docs-tag">🎙️ Podcast</span>
                        <span className="docs-tag">💻 Webinar</span>
                        <span className="docs-tag">🎤 Interview</span>
                        <span className="docs-tag">👥 Panel</span>
                    </div>

                    <h3>Cara Menambah Media</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>Klik <strong>&quot;+ New Media&quot;</strong>.</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>Isi <strong>Title, Type, Category, Date, Duration</strong>, dan <strong>Embed URL</strong> (link YouTube, Spotify, dll).</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>Tambahkan <strong>Description &amp; Speakers</strong> (opsional), lalu <strong>Save</strong>.</div>
                        </div>
                    </div>

                    <div className="docs-callout docs-callout--info">
                        <div className="docs-callout-title">💡 Tips Embed URL</div>
                        <p>
                            Untuk YouTube, gunakan format: <code>https://www.youtube.com/embed/VIDEO_ID</code><br />
                            Untuk Spotify podcast: <code>https://open.spotify.com/embed/episode/EPISODE_ID</code>
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* TEAM */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="team">
                <div className="docs-section-header">
                    <span className="docs-section-icon">◉</span>
                    <h2 className="docs-section-title">Team Members</h2>
                </div>
                <div className="docs-card">
                    <h3>Mengelola Tim</h3>
                    <p>
                        Halaman Team untuk menambah, mengedit, dan mengurutkan anggota tim yang ditampilkan di website.
                    </p>

                    <h3>Field yang Tersedia</h3>
                    <div className="docs-feature-list">
                        <div className="docs-feature">
                            <div className="docs-feature-title">👤 Full Name &amp; Title</div>
                            <div className="docs-feature-desc">Nama lengkap dan jabatan/peran (misal: &quot;Co-founder &amp; Partner&quot;).</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">🔤 Initials</div>
                            <div className="docs-feature-desc">Singkatan 1-2 huruf yang ditampilkan sebagai avatar jika tidak ada foto (misal: &quot;WB&quot;).</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">📝 Bio</div>
                            <div className="docs-feature-desc">Deskripsi singkat tentang latar belakang dan keahlian anggota tim.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">🔗 LinkedIn URL &amp; Photo URL</div>
                            <div className="docs-feature-desc">Opsional — link profil LinkedIn dan URL foto profil.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">📌 Display Order &amp; Featured</div>
                            <div className="docs-feature-desc">Angka urutan tampil (makin kecil makin atas). Checkbox &quot;Featured&quot; = ditampilkan di homepage dan halaman Team. Non-featured = hanya di halaman Team.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* NEWSLETTER */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="newsletter">
                <div className="docs-section-header">
                    <span className="docs-section-icon">✉</span>
                    <h2 className="docs-section-title">Newsletter</h2>
                </div>
                <div className="docs-card">
                    <h3>Sistem Newsletter</h3>
                    <p>
                        Fitur newsletter memungkinkan pengunjung website untuk subscribe dengan memasukkan email di Landing Page.
                        Tidak memerlukan registrasi atau login — cukup input email saja. Sistem dilengkapi perlindungan anti-spam berlapis.
                    </p>

                    <h3>Anti-Spam Protection</h3>
                    <div className="docs-feature-list">
                        <div className="docs-feature">
                            <div className="docs-feature-title">🔒 IP Rate Limiting</div>
                            <div className="docs-feature-desc">Satu alamat IP hanya bisa subscribe satu kali. Jika IP yang sama mencoba subscribe ulang dengan email berbeda, akan otomatis ditolak oleh server.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">💾 Local Storage Protection</div>
                            <div className="docs-feature-desc">Setelah berhasil subscribe, state disimpan di browser. Form otomatis disabled saat website dibuka kembali oleh browser yang sama.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">📧 Duplicate Email Check</div>
                            <div className="docs-feature-desc">Jika email yang sama dimasukkan kedua kali, sistem menolak dan menampilkan pesan &quot;already subscribed&quot;.</div>
                        </div>
                    </div>

                    <h3>Mengelola Subscriber (CMS)</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>
                                Buka menu <strong>Newsletter</strong> di sidebar. Anda akan melihat <strong>daftar semua subscriber</strong> beserta status dan tanggal subscribe.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>
                                <strong>Search &amp; Filter</strong> — gunakan kolom pencarian untuk mencari email tertentu. Gunakan dropdown filter untuk menampilkan Active Only, Inactive Only, atau All.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>
                                <strong>Activate / Deactivate</strong> — toggle status subscriber. Subscriber yang di-deactivate tidak akan menerima email broadcast.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">4</span>
                            <div>
                                <strong>Remove</strong> — hapus subscriber secara permanen dari database.
                            </div>
                        </div>
                    </div>

                    <h3>Export CSV</h3>
                    <p>
                        Klik tombol <strong>&quot;📥 Export CSV&quot;</strong> untuk mengunduh daftar email subscriber ke file CSV.
                        File ini bisa di-import ke platform email marketing seperti Mailchimp, Brevo, atau MailerLite untuk keperluan blast profesional.
                    </p>

                    <h3>Kirim Email Broadcast (via Gmail)</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>Klik tombol <strong>&quot;✉️ Kirim Broadcast&quot;</strong> di halaman Newsletter.</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>Isi <strong>Subject</strong> (judul email) dan <strong>Email Body</strong> (isi pesan — bisa pakai HTML).</div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>Klik <strong>&quot;Send Broadcast&quot;</strong>. Sistem akan mengirim email ke semua subscriber aktif via Gmail SMTP menggunakan BCC.</div>
                        </div>
                    </div>

                    <div className="docs-callout docs-callout--warning">
                        <div className="docs-callout-title">⚠ Batas Pengiriman Gmail</div>
                        <p>
                            Gmail membatasi pengiriman sekitar <strong>500 email/hari</strong> (akun biasa) atau <strong>2000 email/hari</strong> (Google Workspace).
                            Jika subscriber sudah banyak (&gt;500), disarankan menggunakan platform email marketing seperti Mailchimp/Brevo.
                        </p>
                    </div>

                    <div className="docs-callout docs-callout--info">
                        <div className="docs-callout-title">💡 Tips Broadcast</div>
                        <ul>
                            <li>Buat subject yang menarik agar open rate tinggi (contoh: &quot;NADI Weekly: Kebijakan RS Rujukan Baru 2026&quot;).</li>
                            <li>Sertakan link ke artikel terbaru di body email.</li>
                            <li>Kirim secara konsisten (misal: mingguan setiap Jumat) agar subscriber terbiasa.</li>
                            <li>Body mendukung HTML — gunakan <code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>, <code>&lt;a href=&quot;...&quot;&gt;</code> untuk format.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* AI WRITER */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="ai">
                <div className="docs-section-header">
                    <span className="docs-section-icon">✦</span>
                    <h2 className="docs-section-title">AI Writer</h2>
                </div>
                <div className="docs-card">
                    <h3>Apa itu AI Writer?</h3>
                    <p>
                        AI Writer menggunakan <strong>DeepSeek AI</strong> untuk membantu Anda generate topik dan konten artikel secara otomatis.
                        Output yang dihasilkan berupa JSON terstruktur yang siap ditampilkan dalam format layout majalah (magazine-style blocks).
                    </p>

                    <h3>Cara Menggunakan</h3>
                    <div className="docs-steps">
                        <div className="docs-step">
                            <span className="docs-step-num">1</span>
                            <div>
                                <strong>Generate Topics</strong> — masukkan tema/bidang yang Anda inginkan (misal: &quot;kebijakan obat generik&quot;, &quot;transformasi RS digital&quot;).
                                AI akan menghasilkan beberapa topik artikel yang relevan.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">2</span>
                            <div>
                                <strong>Pilih topik</strong> — klik salah satu topik yang dihasilkan.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">3</span>
                            <div>
                                <strong>Generate Article</strong> — AI akan menulis artikel lengkap dengan semua block layout, SEO description, dan keywords.
                            </div>
                        </div>
                        <div className="docs-step">
                            <span className="docs-step-num">4</span>
                            <div>
                                <strong>Review &amp; Publish</strong> — baca hasilnya, edit jika perlu, lalu save sebagai artikel baru.
                            </div>
                        </div>
                    </div>

                    <div className="docs-callout docs-callout--info">
                        <div className="docs-callout-title">💡 Tips AI Writer</div>
                        <ul>
                            <li>Semakin spesifik prompt/tema yang dimasukkan, semakin relevan hasilnya.</li>
                            <li>Selalu review dan edit output AI sebelum mempublikasikan — pastikan akurasi fakta dan data.</li>
                            <li>AI Writer menggunakan API DeepSeek yang terkonfigurasi di <code>.env.local</code>.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* SETTINGS */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="settings">
                <div className="docs-section-header">
                    <span className="docs-section-icon">⚙</span>
                    <h2 className="docs-section-title">Settings</h2>
                </div>
                <div className="docs-card">
                    <h3>Pengaturan Website</h3>
                    <p>
                        Halaman Settings memungkinkan Anda mengkonfigurasi tampilan website secara global.
                    </p>

                    <h3>Landing Page Mode</h3>
                    <div className="docs-feature-list">
                        <div className="docs-feature">
                            <div className="docs-feature-title">🌓 V2 — Light Theme (New)</div>
                            <div className="docs-feature-desc">Desain modern light theme dengan visualisasi ECG, team cards, dan partner marquee.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">🌑 V1 — Dark Theme (Original)</div>
                            <div className="docs-feature-desc">Desain dark corporate original dengan gradient backgrounds.</div>
                        </div>
                        <div className="docs-feature">
                            <div className="docs-feature-title">🚧 Under Development</div>
                            <div className="docs-feature-desc">Halaman maintenance / coming soon — berguna saat website sedang diperbaiki besar-besaran.</div>
                        </div>
                    </div>

                    <h3>Admin Panel Theme</h3>
                    <p>
                        Pilih antara <strong>Dark</strong> (default, sidebar gelap) atau <strong>Light V2</strong> (crimson topbar, sidebar putih, fully light).
                        Setelah mengganti theme, refresh halaman untuk melihat perubahannya.
                    </p>
                </div>
            </section>

            {/* ═══════════════════════════════════════ */}
            {/* USER MANAGEMENT — ADMIN ONLY */}
            {/* ═══════════════════════════════════════ */}
            {isAdmin && (
                <section className="docs-section" id="users">
                    <div className="docs-section-header">
                        <span className="docs-section-icon">⊕</span>
                        <h2 className="docs-section-title">User Management</h2>
                        <span className="docs-admin-badge">Admin Only</span>
                    </div>
                    <div className="docs-card">
                        <h3>Mengelola Pengguna</h3>
                        <p>
                            Halaman User Management hanya bisa diakses oleh user dengan role <strong>admin</strong>.
                            Di sini Anda bisa menambah user baru, mengubah role, mengganti password, dan menghapus user.
                        </p>

                        <h3>Role &amp; Hak Akses</h3>
                        <table className="docs-table">
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th>Hak Akses</th>
                                    <th>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span className="docs-tag docs-tag--crimson">admin</span></td>
                                    <td>Full Access</td>
                                    <td>Bisa semua — termasuk mengelola user, mengubah settings, dan melihat bagian ini di docs.</td>
                                </tr>
                                <tr>
                                    <td><span className="docs-tag">editor</span></td>
                                    <td>Write Access</td>
                                    <td>Bisa membuat dan mengedit artikel, events, media, team, newsletter. Tidak bisa mengelola user atau melihat dokumen ini.</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>Cara Menambah User Baru</h3>
                        <div className="docs-steps">
                            <div className="docs-step">
                                <span className="docs-step-num">1</span>
                                <div>Buka <strong>Users</strong> di sidebar (hanya terlihat oleh admin).</div>
                            </div>
                            <div className="docs-step">
                                <span className="docs-step-num">2</span>
                                <div>Klik <strong>&quot;+ Add User&quot;</strong>.</div>
                            </div>
                            <div className="docs-step">
                                <span className="docs-step-num">3</span>
                                <div>Isi <strong>Name, Email, Password</strong>, dan pilih <strong>Role</strong> (admin atau editor).</div>
                            </div>
                            <div className="docs-step">
                                <span className="docs-step-num">4</span>
                                <div>Klik Save. User baru bisa langsung login menggunakan email dan password tersebut.</div>
                            </div>
                        </div>

                        <h3>Mengganti Password User</h3>
                        <p>
                            Di list Users, klik <strong>&quot;Change Password&quot;</strong> pada user yang bersangkutan.
                            Masukkan password baru (minimal 6 karakter), lalu Save.
                        </p>

                        <h3>Mengubah Role User</h3>
                        <p>
                            Klik tombol <strong>role badge</strong> pada list Users untuk mengganti role antara admin dan editor.
                            Perubahan langsung berlaku pada sesi login selanjutnya.
                        </p>

                        <div className="docs-callout docs-callout--warning">
                            <div className="docs-callout-title">⚠ Perhatian</div>
                            <p>
                                Jangan menghapus satu-satunya akun admin! Pastikan selalu ada minimal 1 admin aktif.
                                Jika semua admin dihapus, Anda harus reset akun melalui database secara manual.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* TROUBLESHOOTING */}
            {/* ═══════════════════════════════════════ */}
            <section className="docs-section" id="troubleshoot">
                <div className="docs-section-header">
                    <span className="docs-section-icon">🔧</span>
                    <h2 className="docs-section-title">Troubleshooting</h2>
                </div>
                <div className="docs-card">
                    <h3>Pertanyaan Umum &amp; Masalah</h3>

                    <div className="docs-faq">
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ Artikel baru tidak muncul di website publik</div>
                            <div className="docs-faq-a">
                                Pastikan Anda sudah menekan tombol <strong>&quot;Save Article&quot;</strong>.
                                Karena halaman menggunakan <code>force-dynamic</code>, perubahan seharusnya langsung terlihat.
                                Jika masih tidak tampil, coba hard-refresh browser (Ctrl + Shift + R).
                            </div>
                        </div>
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ Upload gambar / PDF gagal</div>
                            <div className="docs-faq-a">
                                Periksa batas ukuran file: <strong>gambar maks. 5MB, PDF maks. 20MB</strong>.
                                Pastikan token <code>BLOB_READ_WRITE_TOKEN</code> sudah dikonfigurasi di environment variables.
                            </div>
                        </div>
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ Email broadcast gagal terkirim</div>
                            <div className="docs-faq-a">
                                Pastikan <code>SMTP_USER</code>, <code>SMTP_PASS</code> (App Password, bukan password biasa), dan <code>SMTP_FROM</code>
                                sudah benar di <code>.env.local</code>. Google mengharuskan 2-Step Verification aktif untuk generate App Password.
                            </div>
                        </div>
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ Error &quot;Application error: server-side exception&quot;</div>
                            <div className="docs-faq-a">
                                Biasanya terjadi jika tabel database belum di-migrate. Buka <code>/api/db/migrate</code> di browser untuk menjalankan migrasi.
                                Pastikan juga environment variables database (<code>DATABASE_URL</code>) sudah dikonfigurasi dengan benar.
                            </div>
                        </div>
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ PDF viewer tidak muncul di halaman artikel</div>
                            <div className="docs-faq-a">
                                PDF viewer hanya muncul jika artikel memiliki PDF yang ter-upload.
                                Pastikan Anda sudah meng-upload PDF dari Article Editor dan melihat tanda <strong>&quot;✓ PDF uploaded!&quot;</strong> sebelum menyimpan artikel.
                            </div>
                        </div>
                        <div className="docs-faq-item">
                            <div className="docs-faq-q">❓ Subscriber form di Landing Page tidak bisa diakses</div>
                            <div className="docs-faq-a">
                                Jika user sudah pernah subscribe sebelumnya dari browser yang sama, form akan otomatis di-disable (proteksi localStorage).
                                Untuk testing, buka DevTools → Application → Local Storage → hapus key <code>nadi_subscribed</code>.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="docs-footer">
                <p>NADI CMS Documentation — Last updated April 2026</p>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                    Dibuat oleh tim pengembang NADI. Untuk pertanyaan teknis, hubungi administrator.
                </p>
            </div>
        </div>
    );
}
