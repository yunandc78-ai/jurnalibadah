/**
 * ==============================================================================
 * JURNAL IBADAH HARIAN (AMWA - AL MUHAJIRIN WAL ANSHOR)
 * GOOGLE APPS SCRIPT - DATABASE BACKEND
 * ==============================================================================
 * Petunjuk Pemasangan:
 * 1. Buat Spreadsheet baru di https://sheets.new (Beri judul: "Jurnal Ibadah AMWA - Database")
 * 2. Klik menu: Ekstensi > Apps Script
 * 3. Hapus kode bawaan di editor, lalu tempel seluruh isi kode di bawah ini.
 * 4. Klik "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 5. Pilih jenis: "Web app" (Aplikasi web)
 *    - Description: Jurnal Ibadah Database API
 *    - Execute as: Me (email akun Google Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 6. Klik "Deploy", izinkan hak akses (Authorize access), dan salin "Web app URL" (akhiran /exec).
 * 7. Tempelkan URL tersebut ke dalam aplikasi Jurnal Ibadah Anda!
 * ==============================================================================
 */

var SHEET_USERS = 'Users';
var SHEET_WORSHIP = 'WorshipEntries';

/**
 * Inisialisasi Sheet dan Header Kolom Otomatis
 */
function getOrCreateSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Users
  var sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['id', 'name', 'email', 'password_hash', 'role', 'created_at', 'last_login_at']);
    sheetUsers.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff');
    sheetUsers.setFrozenRows(1);
  } else {
    // Migration: pastikan kolom role ada
    var hData = sheetUsers.getRange(1, 1, 1, Math.max(sheetUsers.getLastColumn(), 6)).getValues()[0];
    if (hData.indexOf('role') === -1) {
      sheetUsers.insertColumnAfter(4);
      sheetUsers.getRange(1, 5).setValue('role').setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff');
    }
  }

  // Sheet WorshipEntries
  var sheetWorship = ss.getSheetByName(SHEET_WORSHIP);
  if (!sheetWorship) {
    sheetWorship = ss.insertSheet(SHEET_WORSHIP);
    sheetWorship.appendRow([
      'id', 'user_id', 'date', 'wajib', 'rawatib', 'sunnah', 
      'lain', 'quran', 'mood', 'notes', 'target_besok', 'updated_at'
    ]);
    sheetWorship.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    sheetWorship.setFrozenRows(1);
  }

  return { ss: ss, users: sheetUsers, worship: sheetWorship };
}

/**
 * Hash password menggunakan SHA-256 bawaan Google Apps Script
 */
function hashPassword(text) {
  if (!text) return '';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    var byteString = hashVal.toString(16);
    if (byteString.length === 1) byteString = '0' + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

/**
 * Helper JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET Requests
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'status';
  var sheets = getOrCreateSheets();

  try {
    // 1. Status Connection Check
    if (action === 'status') {
      return createJsonResponse({
        status: 'success',
        backend: 'google_sheets',
        message: 'Google Spreadsheet Terhubung',
        spreadsheetTitle: sheets.ss.getName(),
        spreadsheetId: sheets.ss.getId(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. List Users
    if (action === 'list_users') {
      var data = sheets.users.getDataRange().getValues();
      var users = [];
      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        if (row[0] && row[2]) { // id & email
          var userRole = (row.length > 6 && row[4]) ? String(row[4]) : (r === 1 ? 'super_admin' : 'user');
          var cAt = (row.length > 6) ? row[5] : row[4];
          var lAt = (row.length > 6) ? row[6] : row[5];
          users.push({
            id: String(row[0]),
            name: String(row[1] || ''),
            email: String(row[2] || ''),
            role: userRole,
            created_at: cAt ? String(cAt) : '',
            last_login_at: lAt ? String(lAt) : ''
          });
        }
      }
      return createJsonResponse({ status: 'success', data: users });
    }

    // 3. Get All Journal Entries for a User
    if (action === 'get_all') {
      var userId = String(e.parameter.user_id || '');
      if (!userId) {
        return createJsonResponse({ status: 'error', message: 'Parameter user_id diperlukan' });
      }

      var wData = sheets.worship.getDataRange().getValues();
      var journalMap = {};

      for (var i = 1; i < wData.length; i++) {
        var row = wData[i];
        var rowUserId = String(row[1]);
        if (rowUserId === userId) {
          var dateKey = formatDateKey(row[2]);
          try {
            journalMap[dateKey] = {
              date: dateKey,
              wajib: row[3] ? JSON.parse(row[3]) : {},
              rawatib: row[4] ? JSON.parse(row[4]) : {},
              sunnah: row[5] ? JSON.parse(row[5]) : {},
              lain: row[6] ? JSON.parse(row[6]) : {},
              quran: row[7] ? JSON.parse(row[7]) : {},
              mood: String(row[8] || ''),
              notes: String(row[9] || ''),
              targetBesok: String(row[10] || ''),
              updatedAt: row[11] ? new Date(row[11]).getTime() : Date.now()
            };
          } catch (err) {
            console.warn('Parse row error at ' + i + ':', err);
          }
        }
      }

      return createJsonResponse({ status: 'success', data: journalMap });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi GET tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Format string tanggal YYYY-MM-DD
 */
function formatDateKey(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val).slice(0, 10);
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(15000);
  } catch (lockErr) {
    return createJsonResponse({ status: 'error', message: 'Database sibuk, silakan ulangi.' });
  }

  try {
    var sheets = getOrCreateSheets();
    var body = {};

    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (ex) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    var action = body.action || (e && e.parameter && e.parameter.action) || '';

    // 1. REGISTER PENGGUNA BARU
    if (action === 'register') {
      var name = String(body.name || '').trim();
      var email = String(body.email || '').trim().toLowerCase();
      var password = String(body.password || '').trim();

      if (!name || !email || !password) {
        return createJsonResponse({ status: 'error', message: 'Nama, email, dan password wajib diisi!' });
      }

      var uData = sheets.users.getDataRange().getValues();
      var pwHash = hashPassword(password);
      var nowIso = new Date().toISOString();

      // Cek apakah email sudah terdaftar
      for (var r = 1; r < uData.length; r++) {
        var existingEmail = String(uData[r][2] || '').toLowerCase();
        if (existingEmail === email) {
          var storedHash = String(uData[r][3] || '');
          if (storedHash && storedHash !== pwHash) {
            return createJsonResponse({ status: 'error', message: 'Password salah! Akun ini telah terdaftar.' });
          }
          var existingRole = (uData[r].length > 6 && uData[r][4]) ? String(uData[r][4]) : (r === 1 ? 'super_admin' : 'user');
          // Update login & nama
          sheets.users.getRange(r + 1, 2).setValue(name);
          var lastLoginCol = (uData[r].length > 6) ? 7 : 6;
          sheets.users.getRange(r + 1, lastLoginCol).setValue(nowIso);
          return createJsonResponse({
            status: 'success',
            message: 'Selamat datang kembali, ' + name + '!',
            user: {
              id: String(uData[r][0]),
              name: name,
              email: email,
              role: existingRole
            }
          });
        }
      }

      // Pengguna Baru: Pengguna pertama otomatis menjadi super_admin
      var assignedRole = (uData.length <= 1 || body.role === 'super_admin') ? 'super_admin' : 'user';
      var newId = 'usr_' + new Date().getTime();
      sheets.users.appendRow([newId, name, email, pwHash, assignedRole, nowIso, nowIso]);

      return createJsonResponse({
        status: 'success',
        message: 'Pengguna ' + name + ' berhasil didaftarkan sebagai ' + (assignedRole === 'super_admin' ? 'Super User (Admin)' : 'Pengguna') + '!',
        user: {
          id: newId,
          name: name,
          email: email,
          role: assignedRole
        }
      });
    }

    // 2. VERIFIKASI PASSWORD SAAT BERALIH PENGGUNA
    if (action === 'verify_password') {
      var userId = String(body.user_id || '');
      var password = String(body.password || '');
      var pwHash = hashPassword(password);

      var uData = sheets.users.getDataRange().getValues();
      for (var r = 1; r < uData.length; r++) {
        if (String(uData[r][0]) === userId) {
          var storedHash = String(uData[r][3] || '');
          if (storedHash && storedHash !== pwHash) {
            return createJsonResponse({ status: 'error', message: 'Password salah. Silakan coba lagi.' });
          }
          var uRole = (uData[r].length > 6 && uData[r][4]) ? String(uData[r][4]) : (r === 1 ? 'super_admin' : 'user');
          // Update last login
          var lastLoginCol = (uData[r].length > 6) ? 7 : 6;
          sheets.users.getRange(r + 1, lastLoginCol).setValue(new Date().toISOString());
          return createJsonResponse({
            status: 'success',
            message: 'Password terverifikasi',
            user: {
              id: String(uData[r][0]),
              name: String(uData[r][1]),
              email: String(uData[r][2]),
              role: uRole
            }
          });
        }
      }

      return createJsonResponse({ status: 'error', message: 'Pengguna tidak ditemukan.' });
    }

    // 3. SIMPAN CATATAN IBADAH SATU HARI (UPSERT)
    if (action === 'save_day') {
      var userId = String(body.user_id || '');
      var dateKey = formatDateKey(body.date || '');
      var data = body.data || {};

      if (!userId || !dateKey) {
        return createJsonResponse({ status: 'error', message: 'user_id dan date wajib diisi!' });
      }

      var wajibStr = JSON.stringify(data.wajib || {});
      var rawatibStr = JSON.stringify(data.rawatib || {});
      var sunnahStr = JSON.stringify(data.sunnah || {});
      var lainStr = JSON.stringify(data.lain || {});
      var quranStr = JSON.stringify(data.quran || {});
      var moodStr = String(data.mood || '');
      var notesStr = String(data.notes || '');
      var targetStr = String(data.targetBesok || data.target_besok || '');
      var nowIso = new Date().toISOString();

      var wData = sheets.worship.getDataRange().getValues();
      var rowIndexToUpdate = -1;

      for (var i = 1; i < wData.length; i++) {
        var rUserId = String(wData[i][1]);
        var rDate = formatDateKey(wData[i][2]);
        if (rUserId === userId && rDate === dateKey) {
          rowIndexToUpdate = i + 1; // 1-indexed in sheet
          break;
        }
      }

      if (rowIndexToUpdate > 0) {
        // Update baris yang sudah ada
        sheets.worship.getRange(rowIndexToUpdate, 4, 1, 9).setValues([[
          wajibStr, rawatibStr, sunnahStr, lainStr, quranStr, moodStr, notesStr, targetStr, nowIso
        ]]);
      } else {
        // Tambah baris baru
        var newEntryId = 'entry_' + dateKey + '_' + new Date().getTime();
        sheets.worship.appendRow([
          newEntryId, userId, dateKey, wajibStr, rawatibStr, sunnahStr,
          lainStr, quranStr, moodStr, notesStr, targetStr, nowIso
        ]);
      }

      return createJsonResponse({ status: 'success', message: 'Catatan ibadah berhasil disimpan ke Google Sheets.' });
    }

    // 4. SINKRONISASI BANYAK HARI (BULK SYNC)
    if (action === 'sync_all') {
      var userId = String(body.user_id || '');
      var database = body.database || {};
      if (!userId) {
        return createJsonResponse({ status: 'error', message: 'user_id diperlukan' });
      }

      var dates = Object.keys(database);
      for (var d = 0; d < dates.length; d++) {
        var dKey = dates[d];
        var item = database[dKey];
        if (item) {
          // Panggil logic simpan
          doPost({
            postData: {
              contents: JSON.stringify({
                action: 'save_day',
                user_id: userId,
                date: dKey,
                data: item
              })
            }
          });
        }
      }

      return createJsonResponse({ status: 'success', message: 'Semua data (' + dates.length + ' hari) tersinkronisasi.' });
    }

    // 5. HAPUS PENGGUNA BESERTA SELURUH CATATAN IBADAHNYA
    if (action === 'delete_user') {
      var userId = String(body.user_id || '');
      if (!userId) {
        return createJsonResponse({ status: 'error', message: 'user_id diperlukan' });
      }

      // Hapus dari sheet Users
      var uData = sheets.users.getDataRange().getValues();
      for (var r = uData.length - 1; r >= 1; r--) {
        if (String(uData[r][0]) === userId) {
          sheets.users.deleteRow(r + 1);
        }
      }

      // Hapus semua entri terkait dari sheet WorshipEntries
      var wData = sheets.worship.getDataRange().getValues();
      for (var w = wData.length - 1; w >= 1; w--) {
        if (String(wData[w][1]) === userId) {
          sheets.worship.deleteRow(w + 1);
        }
      }

      return createJsonResponse({ status: 'success', message: 'Pengguna dan data ibadah berhasil dihapus dari Google Sheets.' });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi POST tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}
