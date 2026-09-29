# Panduan Menghubungkan Google Spreadsheets Sebagai Database Cloud

Aplikasi **Jurnal Ibadah Harian (AMWA)** mendukung **Google Spreadsheets** sebagai database cloud gratis, aman, dan dapat diakses dari mana saja tanpa perlu menginstal XAMPP, PHP, atau server lokal.

---

### Langkah 1: Buat Spreadsheet Baru
1. Buka [https://sheets.new](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet di pojok kiri atas, contoh: `Jurnal Ibadah AMWA - Database`.

---

### Langkah 2: Buka Apps Script
1. Pada menu atas Spreadsheet, klik **Ekstensi (Extensions)** > **Apps Script**.
2. Tab baru editor Google Apps Script akan terbuka.

---

### Langkah 3: Tempel Kode Apps Script
1. Hapus semua teks bawaan (`function myFunction() { ... }`).
2. Buka file [google-apps-script.js](file:///f:/AI%20anti%20gravity/jurnal%20ibadah/google-apps-script.js) di folder proyek ini (atau salin dari tombol **Salin Kode** di aplikasi).
3. Tempelkan seluruh kode tersebut ke dalam editor Apps Script.
4. Klik tombol **Save** (ikon disket 💾 atau tekan `Ctrl + S`).

---

### Langkah 4: Terapkan Sebagai Web App (Deploy)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** (Terapkan) > pilih **New deployment** (Penerapan baru).
2. Klik ikon gerigi ⚙️ di sebelah kiri "Select type", pastikan memilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Jurnal Ibadah API`
   - **Execute as**: `Me (email google Anda)`
   - **Who has access**: `Anyone` *(Penting agar aplikasi web dapat mengirim & menerima data catatan ibadah)*
4. Klik tombol **Deploy**.
5. Jika muncul jendela izin (*Authorization required*):
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Klik **Advanced** (Lanjutan) di kiri bawah > klik **Go to Untitled project (unsafe)**.
   - Klik **Allow** (Izinkan).
6. Google akan memberikan **Web app URL** yang berakhiran `/exec`, contoh:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
7. Klik **Copy** pada Web app URL tersebut.

---

### Langkah 5: Tempel URL ke Aplikasi Jurnal Ibadah (Hak Akses Super User)
1. Buka aplikasi Jurnal Ibadah.
2. Klik **Logo AMWA** di pojok kiri atas aplikasi (Akses Tersembunyi Administrator).
3. Masukkan password akun **Super User (Admin)** Anda atau PIN Master (`admin123` / `amwa2026`).
4. Jendela **Panel Super User (Admin AMWA)** akan terbuka.
5. Tempelkan Web App URL yang sudah disalin ke kolom yang tersedia, lalu klik **Simpan & Hubungkan**.
6. Indikator status akan berubah menjadi hijau: 🟢 **Google Spreadsheet Aktif**.
7. Google Spreadsheet Anda otomatis membuat 2 lembar kerja:
   - `Users`: Menyimpan akun pengguna, email, role (`super_admin` / `user`), dan hash password. Pengguna pertama otomatis menjadi Super User.
   - `WorshipEntries`: Menyimpan checklist sholat wajib, rawatib, amalan sunnah, quran, mood, & catatan ibadah harian.

---

### Aturan Hak Akses Super User (Admin):
- **Eksklusif Admin**: Pengguna biasa tidak dapat melihat atau mengubah URL Google Spreadsheet agar koneksi database tetap aman dan tidak dirusak.
- **Pengguna Pertama Otomatis Super User**: Akun pertama yang didaftarkan ke sistem otomatis mendapatkan hak `super_admin`.
- **Proteksi Hapus Pengguna**: Hanya Super User yang memiliki wewenang menghapus akun pengguna lain dari database.
- **PIN Master Cadangan**: Dilengkapi PIN master cadangan (`admin123`) untuk memulihkan akses konfigurasi jika dibutuhkan.
- **Gratis Selamanya**: Tidak membutuhkan biaya hosting atau langganan database server.
- **Dapat Diakses dari Mana Saja**: Catatan ibadah tersimpan di cloud akun Google pribadi Anda.
- **Transparan**: Anda dapat melihat, memfilter, atau mencetak catatan ibadah langsung dari tampilan tabel Google Sheets.
- **Aman & Terlindungi**: Dilindungi password terenkripsi untuk tiap pengguna akun.
