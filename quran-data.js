/**
 * QURAN DATA MODULE - 114 SURAH METADATA & OFFLINE PRESETS
 * Sumber terjemahan: Kementerian Agama RI (Kemenag)
 * API Endpoint untuk fetch lengkap: https://equran.id/api/v2/surat/{nomor}
 */

const ALL_SURAHS = [
  { nomor: 1, nama: "الفاتحة", namaLatin: "Al-Fatihah", jumlahAyat: 7, tempatTurun: "Mekah", arti: "Pembukaan" },
  { nomor: 2, nama: "البقرة", namaLatin: "Al-Baqarah", jumlahAyat: 286, tempatTurun: "Madinah", arti: "Sapi Betina" },
  { nomor: 3, nama: "اٰل عمران", namaLatin: "Ali 'Imran", jumlahAyat: 200, tempatTurun: "Madinah", arti: "Keluarga Imran" },
  { nomor: 4, nama: "النساۤء", namaLatin: "An-Nisa'", jumlahAyat: 176, tempatTurun: "Madinah", arti: "Wanita" },
  { nomor: 5, nama: "الماۤئدة", namaLatin: "Al-Ma'idah", jumlahAyat: 120, tempatTurun: "Madinah", arti: "Hidangan" },
  { nomor: 6, nama: "الانعام", namaLatin: "Al-An'am", jumlahAyat: 165, tempatTurun: "Mekah", arti: "Binatang Ternak" },
  { nomor: 7, nama: "الاعراف", namaLatin: "Al-A'raf", jumlahAyat: 206, tempatTurun: "Mekah", arti: "Tempat Tertinggi" },
  { nomor: 8, nama: "الانفال", namaLatin: "Al-Anfal", jumlahAyat: 75, tempatTurun: "Madinah", arti: "Rampasan Perang" },
  { nomor: 9, nama: "التوبة", namaLatin: "At-Taubah", jumlahAyat: 129, tempatTurun: "Madinah", arti: "Pengampunan" },
  { nomor: 10, nama: "يونس", namaLatin: "Yunus", jumlahAyat: 109, tempatTurun: "Mekah", arti: "Nabi Yunus" },
  { nomor: 11, nama: "هود", namaLatin: "Hud", jumlahAyat: 123, tempatTurun: "Mekah", arti: "Nabi Hud" },
  { nomor: 12, nama: "يوسف", namaLatin: "Yusuf", jumlahAyat: 111, tempatTurun: "Mekah", arti: "Nabi Yusuf" },
  { nomor: 13, nama: "الرّعد", namaLatin: "Ar-Ra'd", jumlahAyat: 43, tempatTurun: "Madinah", arti: "Guruh" },
  { nomor: 14, nama: "ابرٰهيم", namaLatin: "Ibrahim", jumlahAyat: 52, tempatTurun: "Mekah", arti: "Nabi Ibrahim" },
  { nomor: 15, nama: "الحجر", namaLatin: "Al-Hijr", jumlahAyat: 99, tempatTurun: "Mekah", arti: "Daerah Hijr" },
  { nomor: 16, nama: "النحل", namaLatin: "An-Nahl", jumlahAyat: 128, tempatTurun: "Mekah", arti: "Lebah" },
  { nomor: 17, nama: "الاسراۤء", namaLatin: "Al-Isra'", jumlahAyat: 111, tempatTurun: "Mekah", arti: "Perjalanan Malam" },
  { nomor: 18, nama: "الكهف", namaLatin: "Al-Kahf", jumlahAyat: 110, tempatTurun: "Mekah", arti: "Gua" },
  { nomor: 19, nama: "مريم", namaLatin: "Maryam", jumlahAyat: 98, tempatTurun: "Mekah", arti: "Siti Maryam" },
  { nomor: 20, nama: "طٰهٰ", namaLatin: "Taha", jumlahAyat: 135, tempatTurun: "Mekah", arti: "Taha" },
  { nomor: 21, nama: "الانبياۤء", namaLatin: "Al-Anbiya'", jumlahAyat: 112, tempatTurun: "Mekah", arti: "Para Nabi" },
  { nomor: 22, nama: "الحج", namaLatin: "Al-Hajj", jumlahAyat: 78, tempatTurun: "Madinah", arti: "Haji" },
  { nomor: 23, nama: "المؤمنون", namaLatin: "Al-Mu'minun", jumlahAyat: 118, tempatTurun: "Mekah", arti: "Orang-Orang Mukmin" },
  { nomor: 24, nama: "النّور", namaLatin: "An-Nur", jumlahAyat: 64, tempatTurun: "Madinah", arti: "Cahaya" },
  { nomor: 25, nama: "الفرقان", namaLatin: "Al-Furqan", jumlahAyat: 77, tempatTurun: "Mekah", arti: "Pembeda" },
  { nomor: 26, nama: "الشعراۤء", namaLatin: "Asy-Syu'ara'", jumlahAyat: 227, tempatTurun: "Mekah", arti: "Para Penyair" },
  { nomor: 27, nama: "النمل", namaLatin: "An-Naml", jumlahAyat: 93, tempatTurun: "Mekah", arti: "Semut-semut" },
  { nomor: 28, nama: "القصص", namaLatin: "Al-Qasas", jumlahAyat: 88, tempatTurun: "Mekah", arti: "Kisah-Kisah" },
  { nomor: 29, nama: "العنكبوت", namaLatin: "Al-'Ankabut", jumlahAyat: 69, tempatTurun: "Mekah", arti: "Laba-Laba" },
  { nomor: 30, nama: "الرّوم", namaLatin: "Ar-Rum", jumlahAyat: 60, tempatTurun: "Mekah", arti: "Bangsa Romawi" },
  { nomor: 31, nama: "لقمٰن", namaLatin: "Luqman", jumlahAyat: 34, tempatTurun: "Mekah", arti: "Luqman" },
  { nomor: 32, nama: "السّجدة", namaLatin: "As-Sajdah", jumlahAyat: 30, tempatTurun: "Mekah", arti: "Sajdah" },
  { nomor: 33, nama: "الاحزاب", namaLatin: "Al-Ahzab", jumlahAyat: 73, tempatTurun: "Madinah", arti: "Golongan yang Bersekutu" },
  { nomor: 34, nama: "سبأ", namaLatin: "Saba'", jumlahAyat: 54, tempatTurun: "Mekah", arti: "Kaum Saba'" },
  { nomor: 35, nama: "فاطر", namaLatin: "Fatir", jumlahAyat: 45, tempatTurun: "Mekah", arti: "Pencipta" },
  { nomor: 36, nama: "يٰسۤ", namaLatin: "Yasin", jumlahAyat: 83, tempatTurun: "Mekah", arti: "Yasin" },
  { nomor: 37, nama: "الصّٰفّٰت", namaLatin: "As-Saffat", jumlahAyat: 182, tempatTurun: "Mekah", arti: "Barisan-Barisan" },
  { nomor: 38, nama: "ص", namaLatin: "Sad", jumlahAyat: 88, tempatTurun: "Mekah", arti: "Shad" },
  { nomor: 39, nama: "الزمر", namaLatin: "Az-Zumar", jumlahAyat: 75, tempatTurun: "Mekah", arti: "Rombongan" },
  { nomor: 40, nama: "غافر", namaLatin: "Ghafir", jumlahAyat: 85, tempatTurun: "Mekah", arti: "Maha Pengampun" },
  { nomor: 41, nama: "فصّلت", namaLatin: "Fussilat", jumlahAyat: 54, tempatTurun: "Mekah", arti: "Dijelaskan" },
  { nomor: 42, nama: "الشورى", namaLatin: "Asy-Syura", jumlahAyat: 53, tempatTurun: "Mekah", arti: "Musyawarah" },
  { nomor: 43, nama: "الزخرف", namaLatin: "Az-Zukhruf", jumlahAyat: 89, tempatTurun: "Mekah", arti: "Perhiasan" },
  { nomor: 44, nama: "الدخان", namaLatin: "Ad-Dukhan", jumlahAyat: 59, tempatTurun: "Mekah", arti: "Kabut Asap" },
  { nomor: 45, nama: "الجاثية", namaLatin: "Al-Jasiyah", jumlahAyat: 37, tempatTurun: "Mekah", arti: "Yang Berlutut" },
  { nomor: 46, nama: "الاحقاف", namaLatin: "Al-Ahqaf", jumlahAyat: 35, tempatTurun: "Mekah", arti: "Bukit Pasir" },
  { nomor: 47, nama: "محمد", namaLatin: "Muhammad", jumlahAyat: 38, tempatTurun: "Madinah", arti: "Nabi Muhammad" },
  { nomor: 48, nama: "الفتح", namaLatin: "Al-Fath", jumlahAyat: 29, tempatTurun: "Madinah", arti: "Kemenangan" },
  { nomor: 49, nama: "الحجرات", namaLatin: "Al-Hujurat", jumlahAyat: 18, tempatTurun: "Madinah", arti: "Kamar-Kamar" },
  { nomor: 50, nama: "ق", namaLatin: "Qaf", jumlahAyat: 45, tempatTurun: "Mekah", arti: "Qaf" },
  { nomor: 51, nama: "الذّٰريٰت", namaLatin: "Az-Zariyat", jumlahAyat: 60, tempatTurun: "Mekah", arti: "Angin yang Menerbangkan" },
  { nomor: 52, nama: "الطور", namaLatin: "At-Tur", jumlahAyat: 49, tempatTurun: "Mekah", arti: "Bukit Tursina" },
  { nomor: 53, nama: "النجم", namaLatin: "An-Najm", jumlahAyat: 62, tempatTurun: "Mekah", arti: "Bintang" },
  { nomor: 54, nama: "القمر", namaLatin: "Al-Qamar", jumlahAyat: 55, tempatTurun: "Mekah", arti: "Bulan" },
  { nomor: 55, nama: "الرحمن", namaLatin: "Ar-Rahman", jumlahAyat: 78, tempatTurun: "Madinah", arti: "Maha Pengasih" },
  { nomor: 56, nama: "الواقعة", namaLatin: "Al-Waqi'ah", jumlahAyat: 96, tempatTurun: "Mekah", arti: "Hari Kiamat" },
  { nomor: 57, nama: "الحديد", namaLatin: "Al-Hadid", jumlahAyat: 29, tempatTurun: "Madinah", arti: "Besi" },
  { nomor: 58, nama: "المجادلة", namaLatin: "Al-Mujadilah", jumlahAyat: 22, tempatTurun: "Madinah", arti: "Gugatan" },
  { nomor: 59, nama: "الحشر", namaLatin: "Al-Hasyr", jumlahAyat: 24, tempatTurun: "Madinah", arti: "Pengusiran" },
  { nomor: 60, nama: "الممتحنة", namaLatin: "Al-Mumtahanah", jumlahAyat: 13, tempatTurun: "Madinah", arti: "Wanita yang Diuji" },
  { nomor: 61, nama: "الصف", namaLatin: "As-Saff", jumlahAyat: 14, tempatTurun: "Madinah", arti: "Barisan" },
  { nomor: 62, nama: "الجمعة", namaLatin: "Al-Jumu'ah", jumlahAyat: 11, tempatTurun: "Madinah", arti: "Hari Jumat" },
  { nomor: 63, nama: "المنٰفقون", namaLatin: "Al-Munafiqun", jumlahAyat: 11, tempatTurun: "Madinah", arti: "Orang-Orang Munafik" },
  { nomor: 64, nama: "التغابن", namaLatin: "At-Tagabun", jumlahAyat: 18, tempatTurun: "Madinah", arti: "Pengungkapan Kesalahan" },
  { nomor: 65, nama: "الطلاق", namaLatin: "At-Talaq", jumlahAyat: 12, tempatTurun: "Madinah", arti: "Talak / Perceraian" },
  { nomor: 66, nama: "التحريم", namaLatin: "At-Tahrim", jumlahAyat: 12, tempatTurun: "Madinah", arti: "Pengharaman" },
  { nomor: 67, nama: "الملك", namaLatin: "Al-Mulk", jumlahAyat: 30, tempatTurun: "Mekah", arti: "Kerajaan" },
  { nomor: 68, nama: "القلم", namaLatin: "Al-Qalam", jumlahAyat: 52, tempatTurun: "Mekah", arti: "Pena" },
  { nomor: 69, nama: "الحاۤقّة", namaLatin: "Al-Haqqah", jumlahAyat: 52, tempatTurun: "Mekah", arti: "Hari Kiamat yang Pasti" },
  { nomor: 70, nama: "المعارج", namaLatin: "Al-Ma'arij", jumlahAyat: 44, tempatTurun: "Mekah", arti: "Tempat-Tempat Naik" },
  { nomor: 71, nama: "نوح", namaLatin: "Nuh", jumlahAyat: 28, tempatTurun: "Mekah", arti: "Nabi Nuh" },
  { nomor: 72, nama: "الجن", namaLatin: "Al-Jinn", jumlahAyat: 28, tempatTurun: "Mekah", arti: "Jin" },
  { nomor: 73, nama: "المزمل", namaLatin: "Al-Muzzammil", jumlahAyat: 20, tempatTurun: "Mekah", arti: "Orang yang Berselimut" },
  { nomor: 74, nama: "المدثر", namaLatin: "Al-Muddassir", jumlahAyat: 56, tempatTurun: "Mekah", arti: "Orang yang Berkemul" },
  { nomor: 75, nama: "القيٰمة", namaLatin: "Al-Qiyamah", jumlahAyat: 40, tempatTurun: "Mekah", arti: "Hari Kiamat" },
  { nomor: 76, nama: "الانسان", namaLatin: "Al-Insan", jumlahAyat: 31, tempatTurun: "Madinah", arti: "Manusia" },
  { nomor: 77, nama: "المرسلٰت", namaLatin: "Al-Mursalat", jumlahAyat: 50, tempatTurun: "Mekah", arti: "Malaikat yang Diutus" },
  { nomor: 78, nama: "النبأ", namaLatin: "An-Naba'", jumlahAyat: 40, tempatTurun: "Mekah", arti: "Berita Besar" },
  { nomor: 79, nama: "النّٰزعٰت", namaLatin: "An-Nazi'at", jumlahAyat: 46, tempatTurun: "Mekah", arti: "Malaikat yang Mencabut" },
  { nomor: 80, nama: "عبس", namaLatin: "'Abasa", jumlahAyat: 42, tempatTurun: "Mekah", arti: "Ia Bermuka Masam" },
  { nomor: 81, nama: "التكوير", namaLatin: "At-Takwir", jumlahAyat: 29, tempatTurun: "Mekah", arti: "Penggulungan" },
  { nomor: 82, nama: "الانفطار", namaLatin: "Al-Infitar", jumlahAyat: 19, tempatTurun: "Mekah", arti: "Terbelah" },
  { nomor: 83, nama: "المطفّفين", namaLatin: "Al-Mutaffifin", jumlahAyat: 36, tempatTurun: "Mekah", arti: "Orang-Orang yang Curang" },
  { nomor: 84, nama: "الانشقاق", namaLatin: "Al-Insyiqaq", jumlahAyat: 25, tempatTurun: "Mekah", arti: "Terbelah" },
  { nomor: 85, nama: "البروج", namaLatin: "Al-Buruj", jumlahAyat: 22, tempatTurun: "Mekah", arti: "Gugusan Bintang" },
  { nomor: 86, nama: "الطارق", namaLatin: "At-Tariq", jumlahAyat: 17, tempatTurun: "Mekah", arti: "Yang Datang di Malam Hari" },
  { nomor: 87, nama: "الاعلى", namaLatin: "Al-A'la", jumlahAyat: 19, tempatTurun: "Mekah", arti: "Maha Tinggi" },
  { nomor: 88, nama: "الغاشية", namaLatin: "Al-Ghasyiyah", jumlahAyat: 26, tempatTurun: "Mekah", arti: "Hari Pembalasan" },
  { nomor: 89, nama: "الفجر", namaLatin: "Al-Fajr", jumlahAyat: 30, tempatTurun: "Mekah", arti: "Fajar" },
  { nomor: 90, nama: "البلد", namaLatin: "Al-Balad", jumlahAyat: 20, tempatTurun: "Mekah", arti: "Negeri" },
  { nomor: 91, nama: "الشمس", namaLatin: "Asy-Syams", jumlahAyat: 15, tempatTurun: "Mekah", arti: "Matahari" },
  { nomor: 92, nama: "الليل", namaLatin: "Al-Lail", jumlahAyat: 21, tempatTurun: "Mekah", arti: "Malam" },
  { nomor: 93, nama: "الضحى", namaLatin: "Ad-Duha", jumlahAyat: 11, tempatTurun: "Mekah", arti: "Waktu Dhuha" },
  { nomor: 94, nama: "الشرح", namaLatin: "Asy-Syarh", jumlahAyat: 8, tempatTurun: "Mekah", arti: "Kelapangan" },
  { nomor: 95, nama: "التين", namaLatin: "At-Tin", jumlahAyat: 8, tempatTurun: "Mekah", arti: "Buah Tin" },
  { nomor: 96, nama: "العلق", namaLatin: "Al-'Alaq", jumlahAyat: 19, tempatTurun: "Mekah", arti: "Segumpal Darah" },
  { nomor: 97, nama: "القدر", namaLatin: "Al-Qadr", jumlahAyat: 5, tempatTurun: "Mekah", arti: "Kemuliaan" },
  { nomor: 98, nama: "البينة", namaLatin: "Al-Bayyinah", jumlahAyat: 8, tempatTurun: "Madinah", arti: "Bukti Nyata" },
  { nomor: 99, nama: "الزلزلة", namaLatin: "Az-Zalzalah", jumlahAyat: 8, tempatTurun: "Madinah", arti: "Goncangan Dahsyat" },
  { nomor: 100, nama: "العٰديٰت", namaLatin: "Al-'Adiyat", jumlahAyat: 11, tempatTurun: "Mekah", arti: "Kuda yang Berlari Kencang" },
  { nomor: 101, nama: "القارعة", namaLatin: "Al-Qari'ah", jumlahAyat: 11, tempatTurun: "Mekah", arti: "Hari Kiamat yang Menggetarkan" },
  { nomor: 102, nama: "التكاثر", namaLatin: "At-Takasur", jumlahAyat: 8, tempatTurun: "Mekah", arti: "Bermegah-Megahan" },
  { nomor: 103, nama: "العصر", namaLatin: "Al-'Asr", jumlahAyat: 3, tempatTurun: "Mekah", arti: "Masa / Waktu Sore" },
  { nomor: 104, nama: "الهمزة", namaLatin: "Al-Humazah", jumlahAyat: 9, tempatTurun: "Mekah", arti: "Pengumpat" },
  { nomor: 105, nama: "الفيل", namaLatin: "Al-Fil", jumlahAyat: 5, tempatTurun: "Mekah", arti: "Gajah" },
  { nomor: 106, nama: "قريش", namaLatin: "Quraisy", jumlahAyat: 4, tempatTurun: "Mekah", arti: "Suku Quraisy" },
  { nomor: 107, nama: "الماعون", namaLatin: "Al-Ma'un", jumlahAyat: 7, tempatTurun: "Mekah", arti: "Barang-Barang Berguna" },
  { nomor: 108, nama: "الكوثر", namaLatin: "Al-Kausar", jumlahAyat: 3, tempatTurun: "Mekah", arti: "Nikmat yang Banyak" },
  { nomor: 109, nama: "الكٰفرون", namaLatin: "Al-Kafirun", jumlahAyat: 6, tempatTurun: "Mekah", arti: "Orang-Orang Kafir" },
  { nomor: 110, nama: "النصر", namaLatin: "An-Nasr", jumlahAyat: 3, tempatTurun: "Madinah", arti: "Pertolongan" },
  { nomor: 111, nama: "اللهب", namaLatin: "Al-Lahab", jumlahAyat: 5, tempatTurun: "Mekah", arti: "Gejolak Api" },
  { nomor: 112, nama: "الاخلاص", namaLatin: "Al-Ikhlas", jumlahAyat: 4, tempatTurun: "Mekah", arti: "Kemurnian Keesaan Allah" },
  { nomor: 113, nama: "الفلق", namaLatin: "Al-Falaq", jumlahAyat: 5, tempatTurun: "Mekah", arti: "Waktu Subuh" },
  { nomor: 114, nama: "الناس", namaLatin: "An-Nas", jumlahAyat: 6, tempatTurun: "Mekah", arti: "Umat Manusia" }
];

// Offline Presets - Paket surat siap baca tanpa koneksi internet
const OFFLINE_SURAHS = {
  1: {
    nomor: 1,
    nama: "الفاتحة",
    namaLatin: "Al-Fatihah",
    jumlahAyat: 7,
    tempatTurun: "Mekah",
    arti: "Pembukaan",
    deskripsi: "Surat pembuka Al-Qur'an dan induk Al-Qur'an (Ummul Kitab). Wajib dibaca di setiap rakaat sholat.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/001.mp3",
    ayat: [
      {
        nomorAyat: 1,
        teksArab: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
        teksLatin: "Bismillāhir-raḥmānir-raḥīm(i).",
        teksIndonesia: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001001.mp3"
      },
      {
        nomorAyat: 2,
        teksArab: "اَلْحَمْدُ لِلّٰهِ رَبِّ الْعٰلَمِيْنَۙ",
        teksLatin: "Al-ḥamdu lillāhi rabbil-‘ālamīn(a).",
        teksIndonesia: "Segala puji bagi Allah, Tuhan semesta alam,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001002.mp3"
      },
      {
        nomorAyat: 3,
        teksArab: "الرَّحْمٰنِ الرَّحِيْمِۙ",
        teksLatin: "Ar-raḥmānir-raḥīm(i).",
        teksIndonesia: "Yang Maha Pengasih lagi Maha Penyayang,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001003.mp3"
      },
      {
        nomorAyat: 4,
        teksArab: "مٰلِكِ يَوْمِ الدِّيْنِۗ",
        teksLatin: "Māliki yaumid-dīn(i).",
        teksIndonesia: "Pemilik hari Pembalasan.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001004.mp3"
      },
      {
        nomorAyat: 5,
        teksArab: "اِيَّاكَ نَعْبُدُ وَاِيَّاكَ نَسْتَعِيْنُۗ",
        teksLatin: "Iyyāka na‘budu wa iyyāka nasta‘īn(u).",
        teksIndonesia: "Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001005.mp3"
      },
      {
        nomorAyat: 6,
        teksArab: "اِهْدِنَا الصِّرَاطَ الْمُسْتَقِيْمَۙ",
        teksLatin: "Ihdinaṣ-ṣirāṭal-mustaqīm(a).",
        teksIndonesia: "Bimbinglah kami ke jalan yang lurus,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001006.mp3"
      },
      {
        nomorAyat: 7,
        teksArab: "صِرَاطَ الَّذِيْنَ اَنْعَمْتَ عَلَيْهِمْ ەۙ غَيْرِ الْمَغْضُوْبِ عَلَيْهِمْ وَلَا الضَّاۤلِّيْنَ ࣖ",
        teksLatin: "Ṣirāṭal-lażīna an‘amta ‘alaihim, gairil-magḍūbi ‘alaihim wa laḍ-ḍāllīn(a).",
        teksIndonesia: "(yaitu) jalan orang-orang yang telah Engkau beri nikmat, bukan (jalan) mereka yang dimurkai dan bukan (pula jalan) orang-orang yang sesat.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/001007.mp3"
      }
    ]
  },
  94: {
    nomor: 94,
    nama: "الشرح",
    namaLatin: "Asy-Syarh",
    jumlahAyat: 8,
    tempatTurun: "Mekah",
    arti: "Kelapangan Hati",
    deskripsi: "Menegaskan bahwa bersama kesulitan pasti ada kemudahan yang menyertainya.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/094.mp3",
    ayat: [
      { nomorAyat: 1, teksArab: "اَلَمْ نَشْرَحْ لَكَ صَدْرَكَۙ", teksLatin: "Alam nasyraḥ laka ṣadrak(a).", teksIndonesia: "Bukankah Kami telah melapangkan dadamu (Nabi Muhammad),", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094001.mp3" },
      { nomorAyat: 2, teksArab: "وَوَضَعْنَا عَنْكَ وِزْرَكَۙ", teksLatin: "Wa waḍa‘nā ‘anka wizrak(a).", teksIndonesia: "meringankan beban (tugas-tugas kenabian) darimu,", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094002.mp3" },
      { nomorAyat: 3, teksArab: "الَّذِيْٓ اَنْقَضَ ظَهْرَكَۙ", teksLatin: "Allażī anqaḍa ẓahrak(a).", teksIndonesia: "yang memberatkan punggungmu,", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094003.mp3" },
      { nomorAyat: 4, teksArab: "وَرَفَعْنَا لَكَ ذِكْرَكَۗ", teksLatin: "Wa rafa‘nā laka żikrak(a).", teksIndonesia: "dan meninggikan (derajat) sebutan (nama)-mu bagimu?", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094004.mp3" },
      { nomorAyat: 5, teksArab: "فَاِنَّ مَعَ الْعُسْرِ يُسْرًاۙ", teksLatin: "Fa'inna ma‘al-‘usri yusrā(n).", teksIndonesia: "Maka, sesungguhnya beserta kesulitan ada kemudahan.", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094005.mp3" },
      { nomorAyat: 6, teksArab: "اِنَّ مَعَ الْعُسْرِ يُسْرًاۗ", teksLatin: "Inna ma‘al-‘usri yusrā(n).", teksIndonesia: "Sesungguhnya beserta kesulitan ada kemudahan.", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094006.mp3" },
      { nomorAyat: 7, teksArab: "فَاِذَا فَرَغْتَ فَانْصَبْۙ", teksLatin: "Fa'iżā faragta fanṣab.", teksIndonesia: "Maka, apabila engkau telah selesai (dari suatu urusan), tetaplah bekerja keras (untuk urusan yang lain)", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094007.mp3" },
      { nomorAyat: 8, teksArab: "وَاِلٰى رَبِّكَ فَارْغَبْ ࣖ", teksLatin: "Wa ilā rabbika fargab.", teksIndonesia: "dan hanya kepada Tuhanmulah engkau berharap.", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/094008.mp3" }
    ]
  },
  103: {
    nomor: 103,
    nama: "العصر",
    namaLatin: "Al-'Asr",
    jumlahAyat: 3,
    tempatTurun: "Mekah",
    arti: "Masa / Waktu Sore",
    deskripsi: "Pentingnya memanfaatkan waktu demi keselamatan dunia dan akhirat.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/103.mp3",
    ayat: [
      { nomorAyat: 1, teksArab: "وَالْعَصْرِۙ", teksLatin: "Wal-‘aṣr(i).", teksIndonesia: "Demi masa,", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/103001.mp3" },
      { nomorAyat: 2, teksArab: "اِنَّ الْاِنْسَانَ لَفِيْ خُسْرٍۙ", teksLatin: "Innal-insāna lafī khusr(in).", teksIndonesia: "sesungguhnya manusia benar-benar berada dalam kerugian,", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/103002.mp3" },
      { nomorAyat: 3, teksArab: "اِلَّا الَّذِيْنَ اٰمَنُوْا وَعَمِلُوا الصّٰلِحٰتِ وَتَوَاصَوْا بِالْحَقِّ ەۙ وَتَوَاصَوْا بِالصَّبْرِ ࣖ", teksLatin: "Illal-lażīna āmanū wa ‘amiluṣ-ṣāliḥāti wa tawāṣau bil-ḥaqq(i), wa tawāṣau biṣ-ṣabr(i).", teksIndonesia: "kecuali orang-orang yang beriman dan beramal saleh serta saling menasihati untuk kebenaran dan saling menasihati untuk kesabaran.", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/103003.mp3" }
    ]
  },
  108: {
    nomor: 108,
    nama: "الكوثر",
    namaLatin: "Al-Kausar",
    jumlahAyat: 3,
    tempatTurun: "Mekah",
    arti: "Nikmat yang Berlimpah",
    deskripsi: "Karunia nikmat berlimpah dan perintah mendirikan sholat serta berqurban.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/108.mp3",
    ayat: [
      { nomorAyat: 1, teksArab: "اِنَّآ اَعْطَيْنٰكَ الْكَوْثَرَۗ", teksLatin: "Innā a‘ṭainākal-kauṡar(a).", teksIndonesia: "Sesungguhnya Kami telah memberimu (Nabi Muhammad) nikmat yang banyak.", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/108001.mp3" },
      { nomorAyat: 2, teksArab: "فَصَلِّ لِرَبِّكَ وَانْحَرْۗ", teksLatin: "Faṣalli lirabbika wanḥar.", teksIndonesia: "Maka, laksanakanlah salat karena Tuhanmu dan berkurbanlah!", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/108002.mp3" },
      { nomorAyat: 3, teksArab: "اِنَّ شَانِئَكَ هُوَ الْاَبْتَرُ ࣖ", teksLatin: "Inna syāni'aka huwal-abtar(u).", teksIndonesia: "Sesungguhnya orang yang membencimu, dialah yang terputus (dari rahmat Allah).", audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/108003.mp3" }
    ]
  },
  112: {
    nomor: 112,
    nama: "الاخلاص",
    namaLatin: "Al-Ikhlas",
    jumlahAyat: 4,
    tempatTurun: "Mekah",
    arti: "Kemurnian Keesaan Allah",
    deskripsi: "Pondasi tauhid mengesakan Allah SWT, sebanding sepertiga Al-Qur'an.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/112.mp3",
    ayat: [
      {
        nomorAyat: 1,
        teksArab: "قُلْ هُوَ اللّٰهُ اَحَدٌۚ",
        teksLatin: "Qul huwallāhu aḥad(un).",
        teksIndonesia: "Katakanlah (Nabi Muhammad), “Dialah Allah Yang Maha Esa.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/112001.mp3"
      },
      {
        nomorAyat: 2,
        teksArab: "اَللّٰهُ الصَّمَدُۚ",
        teksLatin: "Allāhuṣ-ṣamad(u).",
        teksIndonesia: "Allah tempat meminta segala sesuatu.",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/112002.mp3"
      },
      {
        nomorAyat: 3,
        teksArab: "لَمْ يَلِدْ وَلَمْ يُوْلَدْۙ",
        teksLatin: "Lam yalid wa lam yūlad.",
        teksIndonesia: "Dia tidak beranak dan tidak pula diperanakkan,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/112003.mp3"
      },
      {
        nomorAyat: 4,
        teksArab: "وَلَمْ يَكُنْ لَّهٗ كُفُوًا اَحَدٌ ࣖ",
        teksLatin: "Wa lam yakul lahū kufuwan aḥad(un).",
        teksIndonesia: "serta tidak ada sesuatu pun yang setara dengan-Nya.”",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/112004.mp3"
      }
    ]
  },
  113: {
    nomor: 113,
    nama: "الفلق",
    namaLatin: "Al-Falaq",
    jumlahAyat: 5,
    tempatTurun: "Mekah",
    arti: "Waktu Subuh",
    deskripsi: "Doa perlindungan dari segala macam kejahatan makhluk, sihir, dan kedengkian.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/113.mp3",
    ayat: [
      {
        nomorAyat: 1,
        teksArab: "قُلْ اَعُوْذُ بِرَبِّ الْفَلَقِۙ",
        teksLatin: "Qul a‘ūżu birabbil-falaq(i).",
        teksIndonesia: "Katakanlah (Nabi Muhammad), “Aku berlindung kepada Tuhan yang menguasai subuh (fajar)",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/113001.mp3"
      },
      {
        nomorAyat: 2,
        teksArab: "مِنْ شَرِّ مَا خَلَقَۙ",
        teksLatin: "Min syarri mā khalaq(a).",
        teksIndonesia: "dari kejahatan (makhluk yang) Dia ciptakan,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/113002.mp3"
      },
      {
        nomorAyat: 3,
        teksArab: "وَمِنْ شَرِّ غَاسِقٍ اِذَا وَقَبَۙ",
        teksLatin: "Wa min syarri gāsiqin iżā waqab(a).",
        teksIndonesia: "dari kejahatan malam apabila telah gelap gulita,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/113003.mp3"
      },
      {
        nomorAyat: 4,
        teksArab: "وَمِنْ شَرِّ النَّفّٰثٰتِ فِى الْعُقَدِۙ",
        teksLatin: "Wa min syarrin-naffāṡāti fil-‘uqad(i).",
        teksIndonesia: "dari kejahatan perempuan-perempuan (penyihir) yang meniup pada buhul-buhul (talinya),",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/113004.mp3"
      },
      {
        nomorAyat: 5,
        teksArab: "وَمِنْ شَرِّ حَاسِدٍ اِذَا حَسَدَ ࣖ",
        teksLatin: "Wa min syarri ḥāsidin iżā ḥasad(a).",
        teksIndonesia: "dan dari kejahatan orang yang dengki apabila dia dengki.”",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/113005.mp3"
      }
    ]
  },
  114: {
    nomor: 114,
    nama: "الناس",
    namaLatin: "An-Nas",
    jumlahAyat: 6,
    tempatTurun: "Mekah",
    arti: "Umat Manusia",
    deskripsi: "Doa perlindungan dari bisikan jahat setan dan manusia.",
    audioFull: "https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/114.mp3",
    ayat: [
      {
        nomorAyat: 1,
        teksArab: "قُلْ اَعُوْذُ بِرَبِّ النَّاسِۙ",
        teksLatin: "Qul a‘ūżu birabbin-nās(i).",
        teksIndonesia: "Katakanlah (Nabi Muhammad), “Aku berlindung kepada Tuhan manusia,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114001.mp3"
      },
      {
        nomorAyat: 2,
        teksArab: "مَلِكِ النَّاسِۙ",
        teksLatin: "Malikin-nās(i).",
        teksIndonesia: "raja manusia,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114002.mp3"
      },
      {
        nomorAyat: 3,
        teksArab: "اِلٰهِ النَّاسِۙ",
        teksLatin: "Ilāhin-nās(i).",
        teksIndonesia: "sembahan manusia,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114003.mp3"
      },
      {
        nomorAyat: 4,
        teksArab: "مِنْ شَرِّ الْوَسْوَاسِ ەۙ الْخَنَّاسِۖ",
        teksLatin: "Min syarril-waswāsil-khannās(i).",
        teksIndonesia: "dari kejahatan (bisikan) setan yang bersembunyi,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114004.mp3"
      },
      {
        nomorAyat: 5,
        teksArab: "الَّذِيْ يُوَسْوِسُ فِيْ صُدُوْرِ النَّاسِۙ",
        teksLatin: "Allażī yuwaswisu fī ṣudūrin-nās(i).",
        teksIndonesia: "yang membisikkan (kejahatan) ke dalam dada manusia,",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114005.mp3"
      },
      {
        nomorAyat: 6,
        teksArab: "مِنَ الْجِنَّةِ وَالنَّاسِ ࣖ",
        teksLatin: "Minal-jinnati wan-nās(i).",
        teksIndonesia: "dari (golongan) jin dan manusia.”",
        audio: "https://cdn.equran.id/audio-partial/Misyari-Rasyid-Al-Afasi/114006.mp3"
      }
    ]
  }
};

/**
 * Fetcher helper with 3-tier caching:
 * 1. Memory / Preset
 * 2. LocalStorage Cache
 * 3. Network API (equran.id v2)
 */
async function fetchSurahDetail(nomor) {
  nomor = parseInt(nomor, 10);
  
  // 1. Preset
  if (OFFLINE_SURAHS[nomor]) {
    return OFFLINE_SURAHS[nomor];
  }

  // 2. LocalStorage Cache
  const cacheKey = `quran_cache_surah_v2_${nomor}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Storage read error", e);
  }

  // 3. Online Fetch
  try {
    const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && json.data) {
      const data = json.data;
      // Normalizing audio
      const audioUrl = (typeof data.audioFull === 'object') 
        ? (data.audioFull['05'] || data.audioFull['01'] || '')
        : (data.audioFull || '');
      
      const normalized = {
        nomor: data.nomor,
        nama: data.nama,
        namaLatin: data.namaLatin,
        jumlahAyat: data.jumlahAyat,
        tempatTurun: data.tempatTurun,
        arti: data.arti,
        deskripsi: data.deskripsi,
        audioFull: audioUrl,
        ayat: data.ayat.map(ay => ({
          nomorAyat: ay.nomorAyat,
          teksArab: ay.teksArab,
          teksLatin: ay.teksLatin,
          teksIndonesia: ay.teksIndonesia,
          audio: (typeof ay.audio === 'object') ? (ay.audio['05'] || ay.audio['01'] || '') : (ay.audio || '')
        }))
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(normalized));
      } catch (err) {
        console.warn("Could not cache surah in storage", err);
      }

      return normalized;
    }
    throw new Error("Invalid API format");
  } catch (err) {
    console.error("Fetch surah error:", err);
    throw err;
  }
}
