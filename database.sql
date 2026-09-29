-- ==============================================================================
-- DATABASE JURNAL IBADAH HARIAN (AMWA - AL MUHAJIRIN WAL ANSHOR)
-- Skema Database MySQL untuk Manajemen Pengguna & Catatan Ibadah Mandiri
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `jurnal_ibadah_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `jurnal_ibadah_db`;

-- ------------------------------------------------------------------------------
-- 1. TABEL USERS (PENGGUNA TERDAFTAR)
-- Menyimpan nama, email Google, password hash (bcrypt), dan tanggal pendaftaran
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL COMMENT 'Nama Lengkap Pengguna',
  `email` VARCHAR(150) NOT NULL UNIQUE COMMENT 'Email Google Pengguna',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash Password Bcrypt',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Pendaftaran',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Waktu Terakhir Masuk',
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABEL WORSHIP_ENTRIES (CATATAN IBADAH HARIAN PER PENGGUNA)
-- Menyimpan checklist sholat wajib, rawatib, sunnah, quran, mood, & refleksi
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `worship_entries` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'Relasi ke tabel users',
  `date` DATE NOT NULL COMMENT 'Tanggal Catatan Ibadah (YYYY-MM-DD)',
  `wajib` JSON NULL COMMENT 'Checklist 5 Sholat Wajib & Jamaah',
  `rawatib` JSON NULL COMMENT 'Checklist 8 Sholat Sunnah Rawatib',
  `sunnah` JSON NULL COMMENT 'Checklist Dhuha, Tahajud, Witir',
  `lain` JSON NULL COMMENT 'Checklist Wudhu, Sedekah, Dzikir',
  `quran` JSON NULL COMMENT 'Tadarus, Hafalan, Tadabbur',
  `mood` VARCHAR(30) NULL DEFAULT '' COMMENT 'Kondisi Hati Pengguna',
  `notes` TEXT NULL COMMENT 'Catatan/Refleksi Ibadah Hari Ini',
  `target_besok` TEXT NULL COMMENT 'Target atau Niat Ibadah Besok',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_worship_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_date` (`user_id`, `date`),
  INDEX `idx_worship_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
