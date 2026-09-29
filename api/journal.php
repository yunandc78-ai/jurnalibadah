<?php
/**
 * WORSHIP JOURNAL API (PHP MySQL)
 * Jurnal Ibadah Harian - AMWA
 */

require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? '';

switch ($action) {
    case 'get_all':
        $userId = (int)($_GET['user_id'] ?? $input['user_id'] ?? 0);
        if ($userId <= 0) {
            sendResponse(['status' => 'error', 'message' => 'Parameter user_id wajib diisi.'], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM `worship_entries` WHERE user_id = ? ORDER BY date ASC");
            $stmt->execute([$userId]);
            $rows = $stmt->fetchAll();

            $dict = [];
            foreach ($rows as $row) {
                $d = $row['date'];
                $dict[$d] = [
                    'date' => $d,
                    'wajib' => json_decode($row['wajib'] ?? '{}', true) ?: [],
                    'rawatib' => json_decode($row['rawatib'] ?? '{}', true) ?: [],
                    'sunnah' => json_decode($row['sunnah'] ?? '{}', true) ?: [],
                    'lain' => json_decode($row['lain'] ?? '{}', true) ?: [],
                    'quran' => json_decode($row['quran'] ?? '{}', true) ?: [],
                    'mood' => $row['mood'] ?? '',
                    'notes' => $row['notes'] ?? '',
                    'targetBesok' => $row['target_besok'] ?? '',
                    'updatedAt' => strtotime($row['updated_at']) * 1000
                ];
            }

            sendResponse([
                'status' => 'success',
                'data' => $dict,
                'count' => count($dict)
            ]);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal membaca jurnal: ' . $e->getMessage()], 500);
        }
        break;

    case 'save_day':
        $userId = (int)($input['user_id'] ?? 0);
        $date = trim($input['date'] ?? '');
        $dayData = $input['data'] ?? [];

        if ($userId <= 0 || empty($date)) {
            sendResponse(['status' => 'error', 'message' => 'Parameter user_id dan date wajib diisi.'], 400);
        }

        try {
            $wajibJson = json_encode($dayData['wajib'] ?? [], JSON_UNESCAPED_UNICODE);
            $rawatibJson = json_encode($dayData['rawatib'] ?? [], JSON_UNESCAPED_UNICODE);
            $sunnahJson = json_encode($dayData['sunnah'] ?? [], JSON_UNESCAPED_UNICODE);
            $lainJson = json_encode($dayData['lain'] ?? [], JSON_UNESCAPED_UNICODE);
            $quranJson = json_encode($dayData['quran'] ?? [], JSON_UNESCAPED_UNICODE);
            $mood = $dayData['mood'] ?? '';
            $notes = $dayData['notes'] ?? '';
            $targetBesok = $dayData['targetBesok'] ?? '';

            $sql = "INSERT INTO `worship_entries` 
                    (user_id, date, wajib, rawatib, sunnah, lain, quran, mood, notes, target_besok, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        wajib = VALUES(wajib),
                        rawatib = VALUES(rawatib),
                        sunnah = VALUES(sunnah),
                        lain = VALUES(lain),
                        quran = VALUES(quran),
                        mood = VALUES(mood),
                        notes = VALUES(notes),
                        target_besok = VALUES(target_besok),
                        updated_at = NOW()";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $userId, $date, $wajibJson, $rawatibJson, $sunnahJson, $lainJson, $quranJson,
                $mood, $notes, $targetBesok
            ]);

            sendResponse([
                'status' => 'success',
                'message' => 'Catatan ibadah berhasil disimpan di MySQL.',
                'date' => $date
            ]);
        } catch (PDOException $e) {
            sendResponse(['status' => 'error', 'message' => 'Gagal menyimpan catatan ibadah: ' . $e->getMessage()], 500);
        }
        break;

    case 'sync_all':
        $userId = (int)($input['user_id'] ?? 0);
        $allData = $input['database'] ?? [];

        if ($userId <= 0 || !is_array($allData)) {
            sendResponse(['status' => 'error', 'message' => 'Parameter user_id dan database wajib diisi.'], 400);
        }

        try {
            $pdo->beginTransaction();
            $sql = "INSERT INTO `worship_entries` 
                    (user_id, date, wajib, rawatib, sunnah, lain, quran, mood, notes, target_besok, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                        wajib = VALUES(wajib),
                        rawatib = VALUES(rawatib),
                        sunnah = VALUES(sunnah),
                        lain = VALUES(lain),
                        quran = VALUES(quran),
                        mood = VALUES(mood),
                        notes = VALUES(notes),
                        target_besok = VALUES(target_besok),
                        updated_at = NOW()";
            $stmt = $pdo->prepare($sql);

            $syncedCount = 0;
            foreach ($allData as $dateKey => $entry) {
                if (empty($dateKey) || !is_array($entry)) continue;
                $stmt->execute([
                    $userId,
                    $dateKey,
                    json_encode($entry['wajib'] ?? [], JSON_UNESCAPED_UNICODE),
                    json_encode($entry['rawatib'] ?? [], JSON_UNESCAPED_UNICODE),
                    json_encode($entry['sunnah'] ?? [], JSON_UNESCAPED_UNICODE),
                    json_encode($entry['lain'] ?? [], JSON_UNESCAPED_UNICODE),
                    json_encode($entry['quran'] ?? [], JSON_UNESCAPED_UNICODE),
                    $entry['mood'] ?? '',
                    $entry['notes'] ?? '',
                    $entry['targetBesok'] ?? ''
                ]);
                $syncedCount++;
            }
            $pdo->commit();

            sendResponse([
                'status' => 'success',
                'message' => "Sinkronisasi berhasil: {$syncedCount} hari tersimpan di MySQL.",
                'synced_count' => $syncedCount
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            sendResponse(['status' => 'error', 'message' => 'Gagal sinkronisasi data: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['status' => 'error', 'message' => 'Action tidak dikenali. Pilihan: get_all, save_day, sync_all.'], 400);
        break;
}
