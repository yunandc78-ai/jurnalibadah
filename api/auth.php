<?php
/**
 * AUTHENTICATION & USER MANAGEMENT API (PHP MySQL)
 * Jurnal Ibadah Harian - AMWA
 */

require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? '';

switch ($action) {
    case 'status':
    case 'check':
        sendResponse([
            'status' => 'success',
            'message' => 'Koneksi database MySQL aktif',
            'server_time' => date('Y-m-d H:i:s')
        ]);
        break;

    case 'list_users':
        try {
            $stmt = $pdo->query("SELECT id, name, email, created_at, last_login_at FROM `users` ORDER BY id DESC");
            $users = $stmt->fetchAll();
            sendResponse([
                'status' => 'success',
                'data' => $users,
                'count' => count($users)
            ]);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal mengambil daftar pengguna: ' . $e->getMessage()], 500);
        }
        break;

    case 'register':
        $name = trim($input['name'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $password = trim($input['password'] ?? '');

        if (empty($name) || empty($email) || empty($password)) {
            sendResponse(['status' => 'error', 'message' => 'Nama, email Google, dan password wajib diisi.'], 400);
        }

        if (strlen($password) < 4) {
            sendResponse(['status' => 'error', 'message' => 'Password minimal 4 karakter.'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(['status' => 'error', 'message' => 'Format email tidak valid.'], 400);
        }

        try {
            // Check if email already exists
            $stmtCheck = $pdo->prepare("SELECT id, name, password_hash FROM `users` WHERE email = ? LIMIT 1");
            $stmtCheck->execute([$email]);
            $existing = $stmtCheck->fetch();

            if ($existing) {
                // If password matches, treat as login
                if (password_verify($password, $existing['password_hash'])) {
                    // Update last login
                    $updateStmt = $pdo->prepare("UPDATE `users` SET last_login_at = NOW(), name = ? WHERE id = ?");
                    $updateStmt->execute([$name, $existing['id']]);

                    sendResponse([
                        'status' => 'success',
                        'message' => "Selamat datang kembali, {$existing['name']}!",
                        'is_new' => false,
                        'user' => [
                            'id' => (int)$existing['id'],
                            'name' => $name,
                            'email' => $email
                        ]
                    ]);
                } else {
                    sendResponse(['status' => 'error', 'message' => 'Email ini sudah terdaftar. Password yang dimasukkan salah.'], 401);
                }
            }

            // Insert new user with bcrypt hash
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $stmtInsert = $pdo->prepare("INSERT INTO `users` (name, email, password_hash, last_login_at) VALUES (?, ?, ?, NOW())");
            $stmtInsert->execute([$name, $email, $passwordHash]);
            $newUserId = (int)$pdo->lastInsertId();

            sendResponse([
                'status' => 'success',
                'message' => "Pengguna {$name} berhasil didaftarkan!",
                'is_new' => true,
                'user' => [
                    'id' => $newUserId,
                    'name' => $name,
                    'email' => $email
                ]
            ], 201);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal mendaftarkan pengguna: ' . $e->getMessage()], 500);
        }
        break;

    case 'verify_password':
    case 'login':
        $userId = $input['user_id'] ?? null;
        $email = strtolower(trim($input['email'] ?? ''));
        $password = trim($input['password'] ?? '');

        if (empty($password) || (empty($userId) && empty($email))) {
            sendResponse(['status' => 'error', 'message' => 'Data identitas dan password harus disertakan.'], 400);
        }

        try {
            if ($userId) {
                $stmt = $pdo->prepare("SELECT id, name, email, password_hash FROM `users` WHERE id = ? LIMIT 1");
                $stmt->execute([(int)$userId]);
            } else {
                $stmt = $pdo->prepare("SELECT id, name, email, password_hash FROM `users` WHERE email = ? LIMIT 1");
                $stmt->execute([$email]);
            }
            $user = $stmt->fetch();

            if (!$user) {
                sendResponse(['status' => 'error', 'message' => 'Pengguna tidak ditemukan.'], 404);
            }

            if (!password_verify($password, $user['password_hash'])) {
                sendResponse(['status' => 'error', 'message' => 'Password salah. Akses ditolak.'], 401);
            }

            // Update last login
            $updateStmt = $pdo->prepare("UPDATE `users` SET last_login_at = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            sendResponse([
                'status' => 'success',
                'message' => "Password benar. Masuk sebagai {$user['name']}.",
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email']
                ]
            ]);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal verifikasi password: ' . $e->getMessage()], 500);
        }
        break;

    case 'delete_user':
        $userId = (int)($input['user_id'] ?? 0);
        if ($userId <= 0) {
            sendResponse(['status' => 'error', 'message' => 'ID pengguna tidak valid.'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `users` WHERE id = ?");
            $stmt->execute([$userId]);
            sendResponse([
                'status' => 'success',
                'message' => 'Pengguna dan seluruh catatan ibadahnya berhasil dihapus dari database.'
            ]);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal menghapus pengguna: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse([
            'status' => 'error',
            'message' => 'Action tidak dikenali. Pilihan: status, list_users, register, verify_password, delete_user.'
        ], 400);
        break;
}
