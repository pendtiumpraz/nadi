// Default stylized HTML for the public legal pages. These act as the seed
// content when the corresponding site_settings rows are still empty so the
// pages always render something professional even before an admin edits them.

export const DEFAULT_PRIVACY_POLICY_HTML = `
<section id="ringkasan">
<h2>1. Ringkasan</h2>
<p>NADI (Network for Advancing Development &amp; Innovation in Health) menghargai privasi setiap pengunjung, kontributor, dan partner yang berinteraksi dengan platform kami. Halaman ini menjelaskan secara ringkas data apa yang kami kumpulkan, mengapa kami menyimpannya, dan hak-hak yang kamu miliki atas data tersebut.</p>
<div class="legal-callout">
  <p><strong>Inti dari kebijakan ini:</strong> kami hanya mengumpulkan data yang diperlukan untuk menjalankan platform, tidak menjual data ke pihak ketiga, dan kamu selalu bisa meminta data kamu dihapus.</p>
</div>
</section>

<section id="data-yang-dikumpulkan">
<h2>2. Data yang Kami Kumpulkan</h2>
<p>Data yang kami simpan dibedakan berdasarkan bagaimana kamu menggunakan NADI:</p>
<ol class="legal-list">
  <li><strong>Pengunjung publik</strong> — log akses anonim (alamat IP, user-agent, halaman yang dibuka) untuk keperluan analitik dan keamanan.</li>
  <li><strong>Pelanggan newsletter</strong> — alamat email, tanggal langganan, dan IP saat berlangganan untuk mencegah spam.</li>
  <li><strong>Kontributor / Partner terdaftar</strong> — nama lengkap, email, password ter-hash (bcrypt), peran (role), dan riwayat aktivitas (artikel yang ditulis, komentar, status persetujuan).</li>
  <li><strong>Tanda tangan persetujuan publikasi</strong> — saat partner menandatangani consent form, kami menyimpan gambar tanda tangan, nama lengkap, tanggal, dan rincian afiliasi.</li>
  <li><strong>Komunikasi langsung</strong> — pesan kontak, balasan komen, dan email yang kamu kirim ke tim NADI.</li>
</ol>
</section>

<section id="tujuan-penggunaan">
<h2>3. Tujuan Penggunaan Data</h2>
<p>Data tersebut hanya digunakan untuk:</p>
<ul class="legal-list">
  <li>Mengoperasikan platform NADI — autentikasi, manajemen artikel, dan workflow review.</li>
  <li>Mengirim notifikasi yang relevan: konfirmasi pendaftaran, hasil review, persetujuan publikasi, dan pengumuman penting.</li>
  <li>Menerbitkan policy product atas namamu — sesuai dengan formulir persetujuan yang kamu tandatangani.</li>
  <li>Menyelidiki insiden keamanan dan mencegah penyalahgunaan platform.</li>
  <li>Meningkatkan kualitas layanan melalui statistik agregat yang tidak mengidentifikasi pengguna individu.</li>
</ul>
</section>

<section id="penyimpanan">
<h2>4. Penyimpanan &amp; Keamanan</h2>
<p>Data disimpan di server cloud yang dikelola oleh penyedia infrastruktur tepercaya. Password tidak pernah disimpan dalam bentuk teks biasa — selalu di-hash menggunakan algoritma bcrypt. Akses ke database produksi dibatasi untuk admin yang memerlukan dan dicatat di audit log internal.</p>
<p>Backup harian dilakukan dan disimpan terenkripsi selama 30 hari. Setiap insiden keamanan yang berdampak pada data pengguna akan dilaporkan dalam waktu 72 jam sesuai standar GDPR yang relevan.</p>
</section>

<section id="berbagi-data">
<h2>5. Berbagi Data dengan Pihak Ketiga</h2>
<p>Kami <strong>tidak menjual</strong> data pribadi ke pihak mana pun. Data hanya dibagikan kepada:</p>
<ul class="legal-list">
  <li>Penyedia infrastruktur cloud (database, file storage, pengiriman email) yang terikat kontrak kerahasiaan.</li>
  <li>Otoritas hukum jika dibutuhkan berdasarkan perintah pengadilan atau peraturan perundang-undangan Indonesia.</li>
  <li>Kepada publik — terbatas pada konten yang kamu setujui untuk dipublikasikan melalui consent form.</li>
</ul>
</section>

<section id="cookie">
<h2>6. Cookie dan Tracking</h2>
<p>Kami menggunakan cookie teknis untuk menjaga sesi login dan menyimpan preferensi (mis. mode tampilan admin, status popup privasi). Kami tidak menggunakan cookie iklan pihak ketiga. Kamu bisa menghapus cookie ini kapan saja melalui pengaturan browser; konsekuensinya kamu akan keluar dari sesi login.</p>
</section>

<section id="hak-pengguna">
<h2>7. Hak Pengguna</h2>
<p>Sebagai pengguna NADI, kamu memiliki hak untuk:</p>
<ul class="legal-list">
  <li><strong>Mengakses</strong> data pribadi yang kami simpan tentang kamu.</li>
  <li><strong>Memperbaiki</strong> data yang tidak akurat melalui halaman profil atau dengan menghubungi tim NADI.</li>
  <li><strong>Menghapus</strong> akun beserta data terkait — kecuali konten yang sudah dipublikasikan secara resmi atas persetujuanmu sebelumnya.</li>
  <li><strong>Membatasi</strong> pemrosesan dengan menonaktifkan sementara akun.</li>
  <li><strong>Memindahkan</strong> data ke layanan lain (data portability) dalam format JSON / CSV.</li>
</ul>
<p>Permintaan terkait hak-hak di atas dapat diajukan via email ke <a href="mailto:privacy@nadi-health.id">privacy@nadi-health.id</a> dan akan diproses dalam 14 hari kerja.</p>
</section>

<section id="anak-anak">
<h2>8. Pengguna di Bawah Umur</h2>
<p>Platform NADI ditujukan untuk pengguna berusia 18 tahun ke atas. Kami tidak secara sengaja mengumpulkan data dari anak di bawah 18 tahun. Jika kami menemukan data semacam itu, akun terkait akan segera dihapus.</p>
</section>

<section id="perubahan">
<h2>9. Perubahan Kebijakan</h2>
<p>Kebijakan ini dapat diperbarui sesuai dengan pengembangan layanan atau perubahan peraturan. Setiap perubahan material akan dikomunikasikan melalui email kepada pengguna terdaftar dan ditampilkan di dashboard saat login pertama setelah perubahan.</p>
</section>

<section id="kontak">
<h2>10. Kontak</h2>
<p>Pertanyaan terkait kebijakan privasi ini bisa diajukan via:</p>
<ul class="legal-list">
  <li>Email: <a href="mailto:privacy@nadi-health.id">privacy@nadi-health.id</a></li>
  <li>Alamat surat: Jl. KH Abdullah Syafi'i No. 28, Jakarta 12840, Indonesia</li>
</ul>
</section>
`.trim();

export const DEFAULT_TERMS_OF_SERVICE_HTML = `
<section id="penerimaan">
<h2>1. Penerimaan Ketentuan</h2>
<p>Dengan mengakses atau menggunakan platform NADI (selanjutnya "Layanan"), kamu menyetujui untuk terikat oleh Ketentuan Penggunaan ini beserta kebijakan privasi yang berlaku. Jika kamu tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan Layanan.</p>
<div class="legal-callout">
  <p><strong>Pemberitahuan:</strong> ketentuan ini merupakan perjanjian hukum yang mengikat antara kamu dengan NADI sebagai penyedia Layanan.</p>
</div>
</section>

<section id="definisi">
<h2>2. Definisi</h2>
<ul class="legal-list">
  <li><strong>NADI</strong> — Network for Advancing Development &amp; Innovation in Health, sebuah platform riset dan publikasi kebijakan kesehatan.</li>
  <li><strong>Pengguna</strong> — individu yang mengakses Layanan, baik sebagai pengunjung, kontributor, partner, reviewer, atau admin.</li>
  <li><strong>Konten</strong> — semua materi yang dipublikasikan melalui Layanan, termasuk policy product, event, media, dan komentar.</li>
  <li><strong>Policy Product</strong> — output tertulis seperti Policy Brief, Policy Paper, atau Opinion Piece yang dipublikasikan melalui NADI.</li>
</ul>
</section>

<section id="akun">
<h2>3. Akun Pengguna</h2>
<p>Untuk menjadi kontributor atau partner, kamu harus mendaftar melalui halaman registrasi. Dengan mendaftar, kamu menyatakan bahwa:</p>
<ol class="legal-list">
  <li>Informasi yang kamu berikan benar dan akurat.</li>
  <li>Kamu berusia minimum 18 tahun atau memiliki kapasitas hukum untuk membuat perjanjian.</li>
  <li>Kamu bertanggung jawab penuh atas kerahasiaan kredensial login dan semua aktivitas yang terjadi dengan akun kamu.</li>
  <li>Kamu akan segera menginformasikan ke tim NADI jika ada akses tidak sah terhadap akun.</li>
</ol>
<p>NADI berhak menolak, menangguhkan, atau menghapus akun yang melanggar ketentuan ini tanpa pemberitahuan terlebih dahulu.</p>
</section>

<section id="hak-kekayaan-intelektual">
<h2>4. Hak Kekayaan Intelektual</h2>
<p>Kepemilikan konten yang dipublikasikan tetap berada di tangan penulis aslinya. Namun, dengan menandatangani consent form publikasi, kamu memberikan NADI lisensi non-eksklusif, perpetual, dan bebas royalti untuk:</p>
<ul class="legal-list">
  <li>Menerbitkan dan mendistribusikan konten melalui platform NADI dan kanal resmi NADI lainnya.</li>
  <li>Memuat ulang, mengarsipkan, dan menerjemahkan konten untuk keperluan dokumentasi.</li>
  <li>Mengutip bagian konten dalam materi promosi atau publikasi turunan, dengan tetap mencantumkan atribusi yang sesuai.</li>
</ul>
<p>Logo, nama "NADI", dan elemen visual platform adalah milik NADI dan tidak boleh digunakan tanpa izin tertulis.</p>
</section>

<section id="standar-konten">
<h2>5. Standar Konten</h2>
<p>Konten yang diajukan untuk publikasi harus memenuhi standar berikut:</p>
<ol class="legal-list">
  <li>Original dan bebas dari plagiarisme.</li>
  <li>Dikembangkan secara etis dan sesuai kode etik penelitian ilmiah.</li>
  <li>Tidak mengandung diskriminasi, ujaran kebencian, fitnah, atau pelanggaran hukum lainnya.</li>
  <li>Mengungkap penggunaan tools AI secara transparan melalui field AI Disclosure pada saat submission.</li>
  <li>Telah melalui review editorial dan revisi sesuai feedback tim Quality Control NADI.</li>
</ol>
<p>NADI berhak menolak, meminta revisi, atau menarik konten yang tidak memenuhi standar di atas.</p>
</section>

<section id="larangan">
<h2>6. Larangan Penggunaan</h2>
<p>Pengguna dilarang:</p>
<ul class="legal-list">
  <li>Menggunakan Layanan untuk tujuan ilegal atau melanggar hak orang lain.</li>
  <li>Mengupload malware, mencoba bypass autentikasi, atau melakukan serangan denial-of-service.</li>
  <li>Membuat akun palsu, melakukan impersonasi, atau menyalahgunakan akun pengguna lain.</li>
  <li>Mengekstrak data secara massal dari Layanan menggunakan automated tools tanpa izin tertulis.</li>
  <li>Mendistribusikan konten yang dipublikasikan di NADI tanpa atribusi yang sesuai.</li>
</ul>
</section>

<section id="pembatasan-tanggung-jawab">
<h2>7. Pembatasan Tanggung Jawab</h2>
<p>NADI menyediakan Layanan "sebagaimana adanya" (as-is). Meskipun kami berusaha keras menjaga keandalan dan keamanan, NADI tidak menjamin Layanan akan selalu tersedia tanpa gangguan atau bebas dari kesalahan.</p>
<p>NADI tidak bertanggung jawab atas:</p>
<ul class="legal-list">
  <li>Akurasi, kelengkapan, atau opini yang terkandung dalam policy product yang merupakan tanggung jawab penulis.</li>
  <li>Kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan Layanan.</li>
  <li>Tindakan pihak ketiga yang berinteraksi dengan konten yang dipublikasikan.</li>
</ul>
</section>

<section id="penghentian">
<h2>8. Penghentian Layanan</h2>
<p>Kamu dapat menghentikan penggunaan Layanan kapan saja dengan menghapus akun melalui dashboard atau menghubungi tim NADI. NADI berhak menangguhkan atau menghentikan akses kamu jika:</p>
<ul class="legal-list">
  <li>Kamu melanggar ketentuan ini.</li>
  <li>Aktivitas akun kamu membahayakan keamanan Layanan atau pengguna lain.</li>
  <li>NADI memutuskan untuk menghentikan operasi Layanan secara keseluruhan.</li>
</ul>
</section>

<section id="hukum-berlaku">
<h2>9. Hukum yang Berlaku</h2>
<p>Ketentuan Penggunaan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan terlebih dahulu secara musyawarah; jika tidak tercapai kesepakatan, akan diserahkan ke Pengadilan Negeri Jakarta Selatan.</p>
</section>

<section id="perubahan-tos">
<h2>10. Perubahan Ketentuan</h2>
<p>NADI dapat memperbarui Ketentuan Penggunaan ini sewaktu-waktu. Perubahan material akan diumumkan melalui email dan ditampilkan di dashboard saat kamu login. Lanjutnya penggunaan Layanan setelah perubahan diberlakukan dianggap sebagai persetujuan terhadap ketentuan baru.</p>
</section>

<section id="kontak-tos">
<h2>11. Kontak</h2>
<p>Pertanyaan, klarifikasi, atau permintaan terkait ketentuan ini dapat diajukan via:</p>
<ul class="legal-list">
  <li>Email: <a href="mailto:legal@nadi-health.id">legal@nadi-health.id</a></li>
  <li>Alamat: Jl. KH Abdullah Syafi'i No. 28, Jakarta 12840, Indonesia</li>
</ul>
</section>
`.trim();
