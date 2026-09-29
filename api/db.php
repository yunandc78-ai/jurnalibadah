<?php
/**
 * DATABASE CONNECTION & CONFIGURATION (PDO MySQL)
 * Jurnal Ibadah Harian - AMWA
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = '127.0.0.1';
$db_port = '3306';
$db_name = 'jurnal_ibadah_db';
$db_user = 'root';
$db_pass = ''; // Default XAMPP password is empty

function getDbConnection() {
    global $db_host, $db_port, $db_name, $db_user, $db_pass;
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // First connect without db name to ensure DB exists
        $dsnWithoutDb = "mysql:host={$db_host};port={$db_port};charset=utf8mb4";
        $initPdo = new PDO($dsnWithoutDb, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ]);

        // Auto-create database if not exists
        $initPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Connect to target database
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Auto-create tables if they don't exist yet
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `users` (
                `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(120) NOT NULL,
                `email` VARCHAR(150) NOT NULL UNIQUE,
                `password_hash` VARCHAR(255) NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `last_login_at` TIMESTAMP NULL DEFAULT NULL,
                INDEX `idx_users_email` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            CREATE TABLE IF NOT EXISTS `worship_entries` (
                `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                `user_id` INT UNSIGNED NOT NULL,
                `date` DATE NOT NULL,
                `wajib` JSON NULL,
                `rawatib` JSON NULL,
                `sunnah` JSON NULL,
                `lain` JSON NULL,
                `quran` JSON NULL,
                `mood` VARCHAR(30) NULL DEFAULT '',
                `notes` TEXT NULL,
                `target_besok` TEXT NULL,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT `fk_worship_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                UNIQUE KEY `uk_user_date` (`user_id`, `date`),
                INDEX `idx_worship_date` (`date`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Gagal terhubung ke MySQL: ' . $e->getMessage(),
            'code' => 'DB_CONNECTION_FAILED'
        ]);
        exit;
    }
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
