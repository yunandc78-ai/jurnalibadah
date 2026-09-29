# Product Requirements Document (PRD)
## Aplikasi Jurnal Ibadah Harian (Islamic Daily Habit & Reflection)

### 1. Ringkasan Produk
Aplikasi **Jurnal Ibadah Harian - AMWA (Al Muhajirin Wal Anshor)** adalah aplikasi web modern, responsif (mobile-first), dan elegan yang dirancang untuk membantu umat Muslim mencatat, memantau, dan menjaga konsistensi (*istiqomah*) ibadah harian. Aplikasi dilengkapi dengan checklist ibadah terstruktur, modul harian Al-Qur'an (Tadarus, Hafalan, & Tadabbur), jurnal refleksi, serta visualisasi statistik dan rekapitulasi streak.

---

### 2. Fitur Utama

#### 2.1. Checklist Ibadah Harian
- **Sholat Wajib 5 Waktu**:
  - Subuh, Dzuhur, Ashar, Maghrib, Isya.
  - Opsi penandaan sholat tepat waktu / berjamaah.
- **Sholat Sunnah Rawatib (Sesuai Sunnah)**:
  - **Subuh**: Qobliyah Subuh (2 Rakaat Fajar - *Mu'akkadah*)
  - **Dzuhur**: Qobliyah Dzuhur (2/4 Rakaat - *Mu'akkadah*) & Ba'diyah Dzuhur (2 Rakaat - *Mu'akkadah*)
  - **Ashar**: Qobliyah Ashar (2 Rakaat - *Ghairu Mu'akkadah*)
  - **Maghrib**: Qobliyah Maghrib (2 Rakaat - *Ghairu Mu'akkadah*) & Ba'diyah Maghrib (2 Rakaat - *Mu'akkadah*)
  - **Isya**: Qobliyah Isya (2 Rakaat - *Ghairu Mu'akkadah*) & Ba'diyah Isya (2 Rakaat - *Mu'akkadah*)
- **Sholat Sunnah Waktu Tertentu**:
  - Dhuha (Min. 2 Rakaat)
  - Tahajud / Qiyamul Lail
  - Witir (Penutup Sholat Malam)
- **Ibadah Harian Lain**:
  - Menjaga Wudhu / Wudhu sebelum tidur.
  - Dzikir Pagi & Petang.
  - Sedekah Harian.

#### 2.2. Modul Al-Qur'an (One Day One Target)
- **Tadarus 1 'Ain per Hari**:
  - Checkmark penyelesaian target.
  - Input nama Surah & nomor 'Ain / Ruku'.
- **Hafalan 5 Ayat per Hari**:
  - Checkmark penyelesaian hafalan.
  - Input Surah dan rentang ayat (misal: *An-Naba 1–5*).
- **Pahami Arti & Tadabbur**:
  - Kolom refleksi makna dan pelajaran utama dari ayat yang dibaca/dihafal hari ini.

#### 2.3. Menu Al-Qur'an Digital & Terjemahan Per Ayat
- **Katalog 114 Surah Lengkap**:
  - Daftar surah interaktif dengan filter (Semua, Makkiyyah, Madaniyyah, Juz 30).
  - Pencarian cepat berdasarkan nama surah, nomor, atau artinya.
  - Informasi lengkap: nomor surat, nama Arab, transliterasi Latin, arti, tempat turun, dan jumlah ayat.
- **Tampilan Baca Per Ayat**:
  - Teks Arab khat digital yang jelas dan berharakat (font *Amiri*).
  - Teks Latin (transliterasi) yang membantu pembacaan.
  - Terjemahan bahasa Indonesia resmi (Kemenag RI) per ayat.
  - Pemutar audio murottal (Qari Misyari Rasyid Al-Afasy) per ayat maupun full surah.
- **Pengaturan Tampilan Baca**:
  - Pilihan ukuran font Arab (Kecil, Normal, Besar).
  - Toggle sembunyikan/tampilkan teks Latin dan terjemahan.
- **Integrasi Langsung ke Jurnal Ibadah**:
  - Tombol "Jadikan Target Hafalan": Mengisi otomatis Surah & ayat terpilih ke form jurnal harian.
  - Tombol "Catat ke Tadabbur": Menyalin arti ayat ke catatan refleksi tadabbur hari ini.
  - Tombol "Tandai Selesai Dibaca": Langsung mencentang target tadarus di jurnal.
- **Dukungan Caching & Offline-First**:
  - Cache otomatis surat yang pernah dibuka ke *LocalStorage*.
  - *Fallback* surat-surat pilihan yang siap dibaca bahkan tanpa koneksi internet.

#### 2.4. Jurnal & Refleksi Harian
- **Navigasi Tanggal Otomatis**:
  - Menampilkan tanggal Masehi & Hijriah secara otomatis.
  - Navigasi cepat: Hari Ini, Kemarin, Besok, serta Datepicker kalender.
- **Catatan & Refleksi Hari Ini**:
  - Kolom apresiasi diri, hal yang disyukuri, dan muhasabah.
- **Target & Niat untuk Esok Hari**:
  - Menetapkan fokus utama ibadah atau amalan spesifik esok hari.
- **Kondisi Hati (Spiritual Mood Tracker)**:
  - Pilihan status rohani: Tenang, Bersemangat, Kurang Fokus, Butuh Doa.

#### 2.5. Statistik, Streak, & Rekapitulasi
- **Ringkasan Hari Ini**:
  - Gauge persentase pemenuhan ibadah harian dinamis (0–100%).
- **Ibadah Streak**:
  - Penghitung hari berturut-turut konsisten mencatat dan beribadah.
- **Rekapitulasi 7 Hari & 30 Hari**:
  - Grafik capaian 7 hari terakhir.
  - Grid aktivitas 30 hari (heatmap konsistensi ibadah).
- **Akumulasi Al-Qur'an**:
  - Total ayat dihafal & total 'ain yang telah ditadaruskan.

#### 2.6. Kenyamanan Pengguna & Fitur Pendukung
- **Penyimpanan Lokal (Offline First)**:
  - LocalStorage otomatis menyimpan seketika tanpa perlu koneksi internet.
- **Ekspor / Impor & Berbagi**:
  - Ekspor data JSON untuk cadangan.
  - Fitur "Bagikan Ringkasan" (format teks rapi ke WhatsApp/Telegram).
- **Desain & Tema**:
  - Tema Luxury Islamic Emerald & Gold dengan logo resmi AMWA.
  - Dukungan Dark Mode dan Light Mode.
  - Responsif optimal untuk smartphone (mobile-friendly), tablet, dan desktop.
- **Feedback Haptik / Audio**:
  - Efek suara sintetis halus saat mencentang ibadah (Web Audio API).
  - Confetti animasi saat mencapai capaian ibadah 100%.

#### 2.7. Manajemen Pengguna, Password & Privasi Mandiri (Database Pengguna)
- **Form Pendaftaran Pengguna & Password**:
  - Formulir pendaftaran mencakup: **Nama Lengkap**, **Email Google** (`@gmail.com`), dan **Password Akun (Minimal 4 Karakter)**.
  - Dilengkapi tombol ikon mata (*eye toggle*) untuk menampilkan atau menyembunyikan password saat pengetikan.
  - Tidak memerlukan OAuth/popup eksternal, bekerja 100% offline-first dan cepat.
- **Penyimpanan di Database Lokal & Enkripsi Hash**:
  - Seluruh pengguna yang terdaftar disimpan dalam database perangkat (`jurnal_ibadah_users_db_v1`).
  - Password di-hash menggunakan algoritma SHA-256 (Web Crypto API) sehingga tidak tersimpan dalam bentuk teks biasa demi keamanan.
- **Proteksi Privasi Tiap Pengguna (Password Protected Switch)**:
  - Setiap pengguna yang terdaftar memiliki database jurnal ibadah mandiri (`jurnal_ibadah_data_user_<userId>`).
  - Untuk beralih ke akun pengguna lain yang tersimpan, aplikasi meminta verifikasi password terlebih dahulu untuk menjaga kerahasiaan catatan amal, doa, dan refleksi harian masing-masing pengguna.
  - Jika password salah, diberikan notifikasi peringatan visual dan akses ditolak.
- **Peralihan & Manajemen Pengguna (User Switcher)**:
  - Tombol profil/login di header atas menampilkan inisial avatar dan nama pengguna yang aktif.
  - Modal manajemen pengguna menampilkan kartu pengguna aktif, daftar pengguna terdaftar, tombol beralih akun terproteksi password, tombol logout, serta opsi hapus akun.

### 2.8. Database Cloud Terintegrasi (Google Spreadsheets)
Aplikasi mendukung **Google Spreadsheets** sebagai database cloud gratis, aman, dan tanpa biaya hosting:
- **Arsitektur Google Apps Script & Spreadsheets**:
  - Berkas skrip: [google-apps-script.js](file:///f:/AI%20anti%20gravity/jurnal%20ibadah/google-apps-script.js)
  - Panduan pemasangan: [google-sheets-setup.md](file:///f:/AI%20anti%20gravity/jurnal%20ibadah/google-sheets-setup.md)
  - Otomatis membuat 2 sheet pada spreadsheet Google pengguna:
    1. `Users`: Menyimpan `id`, `name`, `email`, `password_hash` (SHA-256), `created_at`, dan `last_login_at`.
    2. `WorshipEntries`: Menyimpan checklist ibadah harian (`wajib`, `rawatib`, `sunnah`, `lain`, `quran`, `mood`, `notes`, `target_besok`, `updated_at`).
  - Endpoint REST Web App (`doGet`, `doPost`):
    - `status`: Memeriksa status koneksi spreadsheet.
    - `list_users`: Mengambil daftar pengguna terdaftar.
    - `register`: Mendaftarkan pengguna baru dengan pengecekan email unik dan hashing password.
    - `verify_password`: Memverifikasi password pengguna secara aman saat beralih akun.
    - `get_all`: Mengambil seluruh catatan ibadah pengguna aktif.
    - `save_day`: Menyimpan/memperbarui (*upsert*) checklist dan catatan ibadah satu hari.
    - `sync_all`: Sinkronisasi masal seluruh riwayat ibadah.
    - `delete_user`: Menghapus data pengguna beserta seluruh catatan ibadahnya.
- **Akses Admin Tersembunyi di Logo AMWA (Super User Discreet Access)**:
  - Menu konfigurasi database cloud Google Spreadsheet dan manajemen sistem dipindahkan dari modal akun biasa, dan disembunyikan secara rapi di balik **Logo AMWA** (pada pojok kiri atas aplikasi).
  - Ketika Logo AMWA diklik, sistem memutar nada khusus dan menampilkan jendela **Autentikasi Super User**.
  - Masukkan password akun Super User (Admin) atau PIN Master (`admin123` / `amwa2026`) untuk membuka **Panel Super User (Admin AMWA)**.
  - Jika sesi admin sudah terbuka, mengklik Logo AMWA langsung menampilkan panel admin tanpa meminta password ulang.
  - Di dalam Panel Super User:
    1. Pengaturan URL Web App Google Apps Script & tombol pengujian koneksi.
    2. Panduan setup interaktif 3 menit beserta tombol salin kode Apps Script.
    3. Indikator status real-time Google Spreadsheet.
    4. Manajemen seluruh akun terdaftar dan hak akses menghapus (*delete*) pengguna.
    5. Tombol *Kunci & Keluar Mode Admin* untuk mengunci kembali hak istimewa super user.
  - Pengguna biasa terlindungi dari kebingungan teknis dan tidak dapat mengubah atau memutus URL koneksi cloud.
- **Indikator Status Real-time & Dual-Mode**:
  - 🟢 **Google Spreadsheet Aktif**: Data tersinkronisasi otomatis ke cloud akun Google.
  - 🟡 **Mode Cadangan Lokal**: Tetap dapat digunakan saat offline atau jika spreadsheet belum dihubungkan, tanpa resiko kehilangan data.
- **Dukungan MySQL/PHP Lokal (Opsional)**:
  - Berkas skema SQL [database.sql](file:///f:/AI%20anti%20gravity/jurnal%20ibadah/database.sql) dan endpoint `/api/` tetap tersedia bagi pengguna yang ingin menggunakan server lokal XAMPP.



