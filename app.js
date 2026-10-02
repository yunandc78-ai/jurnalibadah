/**
 * JURNAL IBADAH HARIAN - APP LOGIC
 * High-performance, offline-first Vanilla JS habit & spiritual reflection tracker
 */

(function () {
  'use strict';

  // --- Constants & Defaults ---
  const DEFAULT_STORAGE_KEY = 'jurnal_ibadah_data_v1';
  const USERS_DB_KEY = 'jurnal_ibadah_users_db_v1';
  const ACTIVE_USER_ID_KEY = 'jurnal_ibadah_active_user_id_v1';
  const SOUND_KEY = 'jurnal_ibadah_sound_enabled';
  const THEME_KEY = 'jurnal_ibadah_theme';

  const TOTAL_DAILY_ITEMS = 23; // 5 Wajib + 8 Rawatib + 3 Sunnah + 4 Lain + 3 Quran

  // --- User Database Management (Google Spreadsheet Cloud + Local Fallback) ---
  const GSHEET_URL_KEY = 'jurnal_ibadah_gsheet_url_v1';

  function getGSheetUrl() {
    return (localStorage.getItem(GSHEET_URL_KEY) || '').trim();
  }

  function setGSheetUrl(url) {
    const trimmed = (url || '').trim();
    if (trimmed) {
      localStorage.setItem(GSHEET_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(GSHEET_URL_KEY);
    }
  }

  let isBackendAvailable = false;
  let backendType = 'local'; // 'gsheet', 'mysql', 'local'
  let gsheetTitle = '';

  async function callGSheetApi(action, data = {}, method = 'POST') {
    const url = getGSheetUrl();
    if (!url) return null;

    try {
      if (method === 'GET') {
        const params = new URLSearchParams({ action, ...data }).toString();
        const sep = url.includes('?') ? '&' : '?';
        const res = await fetch(`${url}${sep}${params}`, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow'
        });
        if (res.ok) {
          return await res.json();
        }
      } else {
        const payload = { action, ...data };
        const res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (err) {
      console.warn('GSheet API fetch notice (' + action + '):', err);
    }
    return null;
  }

  async function checkBackendStatus() {
    const pills = [document.getElementById('db-backend-status-pill'), document.getElementById('admin-db-status-pill')].filter(Boolean);
    const texts = [document.getElementById('db-status-text'), document.getElementById('admin-db-status-text')].filter(Boolean);
    const urlInput = document.getElementById('input-gsheet-url');
    const gsheetUrl = getGSheetUrl();

    if (urlInput && !urlInput.value && gsheetUrl) {
      urlInput.value = gsheetUrl;
    }

    const setStatus = (className, titleText, displayText) => {
      pills.forEach(p => {
        p.className = `db-backend-status-pill ${className}`;
        p.title = titleText;
      });
      texts.forEach(t => {
        t.textContent = displayText;
      });
    };

    // 1. Prioritize Google Spreadsheet if URL is configured
    if (gsheetUrl) {
      texts.forEach(t => { t.textContent = 'Menghubungkan ke Google Spreadsheet...'; });
      const result = await callGSheetApi('status', {}, 'GET');
      if (result && result.status === 'success') {
        isBackendAvailable = true;
        backendType = 'gsheet';
        gsheetTitle = result.spreadsheetTitle || 'Google Sheets';
        setStatus('connected', `Terhubung ke Google Spreadsheet: ${gsheetTitle}`, `🟢 Google Spreadsheet Aktif (${gsheetTitle})`);
        return true;
      }
    }

    // 2. Fallback: Check local PHP MySQL if running
    try {
      const res = await fetch('api/auth.php?action=status', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          isBackendAvailable = true;
          backendType = 'mysql';
          setStatus('connected', 'Terhubung ke database MySQL lokal via PHP', '🟢 MySQL Database Aktif (PHP)');
          return true;
        }
      }
    } catch (e) {
      // Offline mode
    }

    isBackendAvailable = false;
    backendType = 'local';
    const failMsg = gsheetUrl 
      ? '🟡 Gagal Terhubung ke Google Sheet (Cek Izin Web App)' 
      : '🟡 Mode Cadangan Lokal (Belum Terhubung ke Google Sheet)';
    setStatus('offline', 'Atur URL Google Apps Script untuk sinkronisasi cloud atau gunakan mode lokal', failMsg);
    return false;
  }

  function getUsersDatabase() {
    try {
      const raw = localStorage.getItem(USERS_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse users database', e);
      return [];
    }
  }

  function saveUsersDatabase(users) {
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to write users to database', e);
    }
  }

  async function syncUsersFromBackend() {
    // 1. Sync from Google Spreadsheet if connected
    if (backendType === 'gsheet') {
      const res = await callGSheetApi('list_users', {}, 'GET');
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        const remoteUsers = res.data.map(u => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
          lastLoginAt: u.last_login_at ? new Date(u.last_login_at).getTime() : null
        }));
        saveUsersDatabase(remoteUsers);
        renderUsersUI();
        return;
      }
    }

    // 2. Sync from local PHP MySQL if connected
    if (backendType === 'mysql') {
      try {
        const res = await fetch('api/auth.php?action=list_users');
        if (res.ok) {
          const json = await res.json();
          if (json && json.status === 'success' && Array.isArray(json.data)) {
            const remoteUsers = json.data.map(u => ({
              id: String(u.id),
              name: u.name,
              email: u.email,
              createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
              lastLoginAt: u.last_login_at ? new Date(u.last_login_at).getTime() : null
            }));
            saveUsersDatabase(remoteUsers);
            renderUsersUI();
          }
        }
      } catch (e) {
        console.warn('Sync users notice:', e);
      }
    }
  }

  function getActiveUserId() {
    return localStorage.getItem(ACTIVE_USER_ID_KEY) || null;
  }

  function getActiveUser() {
    const activeId = getActiveUserId();
    if (!activeId) return null;
    const users = getUsersDatabase();
    return users.find(u => String(u.id) === String(activeId)) || null;
  }

  function getCurrentStorageKey() {
    const activeUser = getActiveUser();
    if (activeUser && activeUser.id) {
      return `jurnal_ibadah_data_user_${activeUser.id}`;
    }
    return DEFAULT_STORAGE_KEY;
  }

  async function hashPassword(plainText) {
    if (!plainText) return '';
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let hash = 0;
      for (let i = 0; i < plainText.length; i++) {
        const char = plainText.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'hash_' + Math.abs(hash).toString(16);
    }
  }

  let pendingSwitchUserId = null;

  async function registerOrLoginUser(name, email, password) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPw = password ? password.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedPw) {
      showToast('Harap isi Nama, Email, dan Password!');
      return;
    }

    if (trimmedPw.length < 4) {
      showToast('Password minimal 4 karakter!');
      return;
    }

    // 1. Google Spreadsheet Backend
    if (backendType === 'gsheet') {
      const json = await callGSheetApi('register', {
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPw
      });
      if (json && json.status === 'success') {
        const user = json.user;
        localStorage.setItem(ACTIVE_USER_ID_KEY, String(user.id));
        await syncUsersFromBackend();
        await loadUserJournalFromBackend(user.id);
        showToast(json.message || `Masuk sebagai ${user.name}`);

        playTone(660, 'sine', 0.12, 0.15);
        setTimeout(() => playTone(880, 'sine', 0.15, 0.12), 90);

        document.getElementById('modal-user-manager')?.classList.add('hidden');
        renderAll();
        return;
      } else if (json && json.status === 'error') {
        showToast(json.message || 'Gagal mendaftar ke Google Sheet');
        playTone(250, 'sawtooth', 0.15, 0.2);
        return;
      }
    }

    // 2. Local PHP MySQL Backend (if available)
    if (backendType === 'mysql') {
      try {
        const res = await fetch('api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name: trimmedName,
            email: trimmedEmail,
            password: trimmedPw
          })
        });
        const json = await res.json();
        if (res.ok && json.status === 'success') {
          const user = json.user;
          localStorage.setItem(ACTIVE_USER_ID_KEY, String(user.id));
          await syncUsersFromBackend();
          await loadUserJournalFromBackend(user.id);
          showToast(json.message || `Masuk sebagai ${user.name}`);

          playTone(660, 'sine', 0.12, 0.15);
          setTimeout(() => playTone(880, 'sine', 0.15, 0.12), 90);

          document.getElementById('modal-user-manager')?.classList.add('hidden');
          renderAll();
          return;
        } else {
          showToast(json.message || 'Gagal mendaftar ke database');
          playTone(250, 'sawtooth', 0.15, 0.2);
          return;
        }
      } catch (err) {
        console.warn('Backend register notice:', err);
      }
    }

    // Offline / Local Fallback
    const hashed = await hashPassword(trimmedPw);
    let users = getUsersDatabase();
    let existing = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      if (existing.passwordHash && existing.passwordHash !== hashed) {
        showToast('Password salah! Akun ini telah terdaftar.');
        playTone(250, 'sawtooth', 0.15, 0.2);
        return;
      }
      if (!existing.passwordHash) {
        existing.passwordHash = hashed;
      }
      existing.name = trimmedName;
      existing.lastLoginAt = Date.now();
      localStorage.setItem(ACTIVE_USER_ID_KEY, String(existing.id));
      saveUsersDatabase(users);
      showToast(`Masuk sebagai ${existing.name}`);
    } else {
      const newUser = {
        id: 'usr_' + Date.now(),
        name: trimmedName,
        email: trimmedEmail,
        passwordHash: hashed,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };
      users.unshift(newUser);
      saveUsersDatabase(users);
      localStorage.setItem(ACTIVE_USER_ID_KEY, String(newUser.id));
      showToast(`Pengguna ${newUser.name} berhasil didaftarkan!`);
    }

    saveDatabase();
    db = loadDatabase();

    playTone(660, 'sine', 0.12, 0.15);
    setTimeout(() => playTone(880, 'sine', 0.15, 0.12), 90);

    const modalUserManager = document.getElementById('modal-user-manager');
    modalUserManager?.classList.add('hidden');

    renderAll();
  }

  function promptPasswordForUser(userId) {
    const users = getUsersDatabase();
    const target = users.find(u => String(u.id) === String(userId));
    if (!target) return;

    if (String(getActiveUserId()) === String(userId)) {
      document.getElementById('modal-user-manager')?.classList.add('hidden');
      return;
    }

    pendingSwitchUserId = userId;
    const promptModal = document.getElementById('modal-password-prompt');
    const promptAvatar = document.getElementById('prompt-target-avatar');
    const promptName = document.getElementById('prompt-target-name');
    const promptEmail = document.getElementById('prompt-target-email');
    const inputPw = document.getElementById('input-verify-password');
    const pwError = document.getElementById('prompt-pw-error');

    if (promptAvatar) promptAvatar.textContent = (target.name || 'U').charAt(0).toUpperCase();
    if (promptName) promptName.textContent = target.name;
    if (promptEmail) promptEmail.textContent = target.email;
    if (inputPw) inputPw.value = '';
    pwError?.classList.add('hidden');

    document.getElementById('modal-user-manager')?.classList.add('hidden');
    promptModal?.classList.remove('hidden');
    setTimeout(() => inputPw?.focus(), 150);
  }

  async function verifyAndSwitchUser(password) {
    if (!pendingSwitchUserId) return;
    const users = getUsersDatabase();
    const target = users.find(u => String(u.id) === String(pendingSwitchUserId));
    if (!target) return;

    const trimmed = password ? password.trim() : '';
    const pwError = document.getElementById('prompt-pw-error');

    // 1. Google Spreadsheet Verification
    if (backendType === 'gsheet') {
      const json = await callGSheetApi('verify_password', {
        user_id: pendingSwitchUserId,
        password: trimmed
      });
      if (json && json.status === 'success') {
        document.getElementById('modal-password-prompt')?.classList.add('hidden');
        const userId = pendingSwitchUserId;
        pendingSwitchUserId = null;
        await switchUser(userId);
        return;
      } else if (json && json.status === 'error') {
        if (pwError) {
          pwError.classList.remove('hidden');
          pwError.textContent = '❌ ' + (json.message || 'Password salah.');
        }
        playTone(250, 'sawtooth', 0.15, 0.2);
        return;
      }
    }

    // 2. Local PHP MySQL Verification
    if (backendType === 'mysql') {
      try {
        const res = await fetch('api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_password',
            user_id: pendingSwitchUserId,
            password: trimmed
          })
        });
        const json = await res.json();
        if (res.ok && json.status === 'success') {
          document.getElementById('modal-password-prompt')?.classList.add('hidden');
          const userId = pendingSwitchUserId;
          pendingSwitchUserId = null;
          await switchUser(userId);
          return;
        } else {
          if (pwError) {
            pwError.classList.remove('hidden');
            pwError.textContent = '❌ ' + (json.message || 'Password salah.');
          }
          playTone(250, 'sawtooth', 0.15, 0.2);
          return;
        }
      } catch (err) {
        console.warn('Backend verify notice:', err);
      }
    }

    // 3. Offline / Local Fallback
    const hashed = await hashPassword(trimmed);
    if (target.passwordHash && target.passwordHash !== hashed) {
      if (pwError) {
        pwError.classList.remove('hidden');
        pwError.textContent = '❌ Password salah. Silakan coba lagi.';
      }
      playTone(250, 'sawtooth', 0.15, 0.2);
      return;
    }

    document.getElementById('modal-password-prompt')?.classList.add('hidden');
    const uId = pendingSwitchUserId;
    pendingSwitchUserId = null;
    await switchUser(uId);
  }

  async function switchUser(userId) {
    const users = getUsersDatabase();
    const target = users.find(u => String(u.id) === String(userId));
    if (!target) return;

    saveDatabase();
    target.lastLoginAt = Date.now();
    saveUsersDatabase(users);

    localStorage.setItem(ACTIVE_USER_ID_KEY, String(target.id));

    // Load data from Backend if available
    if (isBackendAvailable) {
      await loadUserJournalFromBackend(target.id);
    } else {
      db = loadDatabase();
    }

    playTone(660, 'sine', 0.12, 0.15);
    showToast(`Beralih ke akun ${target.name}`);

    const modalUserManager = document.getElementById('modal-user-manager');
    modalUserManager?.classList.add('hidden');

    renderAll();
  }

  async function loadUserJournalFromBackend(userId) {
    if (!userId) return;

    // 1. Google Spreadsheet
    if (backendType === 'gsheet') {
      const json = await callGSheetApi('get_all', { user_id: userId }, 'GET');
      if (json && json.status === 'success' && json.data) {
        const key = `jurnal_ibadah_data_user_${userId}`;
        let loaded = json.data;
        if (Object.keys(loaded).length === 0) {
          loaded = generateSampleDatabase();
          callGSheetApi('sync_all', { user_id: userId, database: loaded });
        }
        localStorage.setItem(key, JSON.stringify(loaded));
        db = loaded;
        return;
      }
    }

    // 2. PHP MySQL
    if (backendType === 'mysql') {
      try {
        const res = await fetch(`api/journal.php?action=get_all&user_id=${userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.status === 'success' && json.data) {
            const key = `jurnal_ibadah_data_user_${userId}`;
            let loaded = json.data;
            if (Object.keys(loaded).length === 0) {
              loaded = generateSampleDatabase();
              fetch('api/journal.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'sync_all',
                  user_id: userId,
                  database: loaded
                })
              }).catch(() => {});
            }
            localStorage.setItem(key, JSON.stringify(loaded));
            db = loaded;
          }
        }
      } catch (e) {
        console.warn('Backend load journal notice:', e);
      }
    }
  }

  function logoutUser() {
    saveDatabase();
    localStorage.removeItem(ACTIVE_USER_ID_KEY);
    db = loadDatabase();

    playTone(440, 'sine', 0.1, 0.1);
    showToast('Telah keluar dari akun');

    const modalUserManager = document.getElementById('modal-user-manager');
    modalUserManager?.classList.add('hidden');

    renderAll();
  }

  async function deleteUser(userId) {
    let users = getUsersDatabase();
    const target = users.find(u => String(u.id) === String(userId));
    if (!target) return;

    if (!confirm(`Hapus pengguna "${target.name}" (${target.email}) beserta seluruh data jurnalnya dari database?`)) {
      return;
    }

    if (backendType === 'gsheet') {
      await callGSheetApi('delete_user', { user_id: userId });
    } else if (backendType === 'mysql') {
      try {
        await fetch('api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_user',
            user_id: userId
          })
        });
      } catch (err) {
        console.warn('Backend delete notice:', err);
      }
    }

    users = users.filter(u => String(u.id) !== String(userId));
    saveUsersDatabase(users);

    try {
      localStorage.removeItem(`jurnal_ibadah_data_user_${userId}`);
    } catch (e) {}

    showToast(`Pengguna ${target.name} telah dihapus.`);

    if (String(getActiveUserId()) === String(userId)) {
      logoutUser();
    } else {
      renderUsersUI();
    }
  }

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;
  let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false'; // default true

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  function playCheckSound() {
    playTone(587.33, 'sine', 0.1, 0.12); // D5
    setTimeout(() => playTone(880.00, 'sine', 0.14, 0.10), 60); // A5
  }

  function playCompleteCelebrationSound() {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, 'triangle', 0.25, 0.18), idx * 100);
    });
  }

  // --- Hijri Date Calculation ---
  function getHijriDate(date) {
    // Astronomical approximation for Umm al-Qura calendar
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    let m = month + 1;
    let y = year;
    if (m < 3) {
      y -= 1;
      m += 12;
    }

    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    const b2 = jd - 1948440 + 10632;
    const n = Math.floor((b2 - 1) / 10631);
    const b3 = b2 - 10631 * n + 354;
    const j = (Math.floor((10985 - b3) / 5316)) * (Math.floor((50 * b3) / 17719)) + (Math.floor(b3 / 5670)) * (Math.floor((43 * b3) / 15238));
    const b4 = b3 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    
    const mH = Math.floor((24 * b4) / 709);
    const dH = b4 - Math.floor((709 * mH) / 24);
    const yH = 30 * n + j - 30;

    const hijriMonths = [
      'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
      'Jumadil Ula', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
      'Ramadhan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
    ];

    const monthName = hijriMonths[(mH - 1) % 12] || 'Bulan Hijriah';
    return `${dH} ${monthName} ${yH} H`;
  }

  function formatGregorianIndo(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function fromDateKey(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // --- State ---
  let currentDate = new Date();
  let db = loadDatabase();

  function getDefaultDayData(dateStr) {
    return {
      date: dateStr,
      wajib: {
        subuh: { done: false, jamaah: false },
        dzuhur: { done: false, jamaah: false },
        ashar: { done: false, jamaah: false },
        maghrib: { done: false, jamaah: false },
        isya: { done: false, jamaah: false }
      },
      rawatib: {
        qobliyahSubuh: false,
        qobliyahDzuhur: false,
        badiyahDzuhur: false,
        qobliyahAshar: false,
        qobliyahMaghrib: false,
        badiyahMaghrib: false,
        qobliyahIsya: false,
        badiyahIsya: false
      },
      sunnah: {
        dhuha: false,
        tahajud: false,
        witir: false
      },
      shaum: {
        puasaHariIni: false,
        jenis: 'senin-kamis',
        catatan: ''
      },
      lain: {
        wudhu: false,
        sedekah: false,
        dzikirPagi: false,
        dzikirPetang: false
      },
      quran: {
        tadarusDone: false,
        tadarusSurah: '',
        tadarusAin: '',
        hafalanDone: false,
        hafalanSurah: '',
        hafalanAyat: '',
        hafalanAyatStart: '',
        hafalanAyatEnd: '',
        hafalanAyatList: [],
        hafalanStatus: 'ziyadah',
        tadabburDone: false,
        tadabburText: ''
      },
      mood: '',
      notes: '',
      targetBesok: '',
      updatedAt: Date.now()
    };
  }

  function loadDatabase() {
    try {
      const key = getCurrentStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) {
        // If first time, load sample data so app immediately feels rich and lively!
        const initial = generateSampleDatabase();
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw) || {};
    } catch (e) {
      console.error('Failed to parse database from localStorage', e);
      return {};
    }
  }

  let saveJournalTimer = null;
  function saveDatabase(dateKeyToSync = null) {
    try {
      const key = getCurrentStorageKey();
      localStorage.setItem(key, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to write database to localStorage', e);
    }

    if (isBackendAvailable) {
      const activeId = getActiveUserId();
      if (activeId) {
        clearTimeout(saveJournalTimer);
        saveJournalTimer = setTimeout(() => {
          const syncKey = dateKeyToSync || toDateKey(currentDate);
          const dayData = db[syncKey];
          if (dayData) {
            if (backendType === 'gsheet') {
              callGSheetApi('save_day', {
                user_id: activeId,
                date: syncKey,
                data: dayData
              });
            } else if (backendType === 'mysql') {
              fetch('api/journal.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'save_day',
                  user_id: activeId,
                  date: syncKey,
                  data: dayData
                })
              }).catch(err => console.warn('Sync to MySQL error:', err));
            }
          }
        }, 400);
      }
    }
  }

  function getCurrentDayData() {
    const key = toDateKey(currentDate);
    if (!db[key]) {
      db[key] = getDefaultDayData(key);
    }
    // Backward compatibility for rawatib & sunnah
    if (!db[key].rawatib) {
      db[key].rawatib = {
        qobliyahSubuh: false,
        qobliyahDzuhur: false,
        badiyahDzuhur: false,
        qobliyahAshar: false,
        qobliyahMaghrib: false,
        badiyahMaghrib: false,
        qobliyahIsya: false,
        badiyahIsya: false
      };
      if (db[key].sunnah && db[key].sunnah.rawatib) {
        db[key].rawatib.qobliyahSubuh = true;
        db[key].rawatib.qobliyahDzuhur = true;
        db[key].rawatib.badiyahDzuhur = true;
        db[key].rawatib.badiyahMaghrib = true;
        db[key].rawatib.badiyahIsya = true;
      }
    }
    if (!db[key].sunnah) {
      db[key].sunnah = { dhuha: false, tahajud: false, witir: false };
    }
    // Backward compatibility for shaum
    if (!db[key].shaum) {
      db[key].shaum = {
        puasaHariIni: false,
        jenis: 'senin-kamis',
        catatan: ''
      };
    }
    // Backward compatibility for hafalan
    if (!db[key].quran) {
      db[key].quran = {
        tadarusDone: false,
        tadarusSurah: '',
        tadarusAin: '',
        hafalanDone: false,
        hafalanSurah: '',
        hafalanAyat: '',
        hafalanAyatStart: '',
        hafalanAyatEnd: '',
        hafalanAyatList: [],
        hafalanStatus: 'ziyadah',
        tadabburDone: false,
        tadabburText: ''
      };
    } else {
      if (!Array.isArray(db[key].quran.hafalanAyatList)) db[key].quran.hafalanAyatList = [];
      if (!db[key].quran.hafalanStatus) db[key].quran.hafalanStatus = 'ziyadah';
    }
    return db[key];
  }

  // --- Sample Data Generator for Demo ---
  function generateSampleDatabase() {
    const data = {};
    const today = new Date();

    // Generate past 7 days of realistic habit logs
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);

      const isToday = i === 0;
      const completionRate = isToday ? 0.6 : (0.7 + (i % 3) * 0.1);

      const dayObj = getDefaultDayData(key);

      // Sholat wajib
      dayObj.wajib.subuh.done = true;
      dayObj.wajib.subuh.jamaah = i % 2 === 0;
      dayObj.wajib.dzuhur.done = true;
      dayObj.wajib.dzuhur.jamaah = true;
      dayObj.wajib.ashar.done = true;
      dayObj.wajib.ashar.jamaah = false;
      dayObj.wajib.maghrib.done = !isToday || completionRate > 0.5;
      dayObj.wajib.maghrib.jamaah = true;
      dayObj.wajib.isya.done = !isToday;
      dayObj.wajib.isya.jamaah = true;

      // Sunnah Rawatib
      dayObj.rawatib = {
        qobliyahSubuh: true,
        qobliyahDzuhur: i % 2 === 0,
        badiyahDzuhur: true,
        qobliyahAshar: i % 3 === 0,
        qobliyahMaghrib: false,
        badiyahMaghrib: !isToday || completionRate > 0.5,
        qobliyahIsya: false,
        badiyahIsya: !isToday
      };

      // Sunnah Lain
      dayObj.sunnah.dhuha = i % 2 === 0;
      dayObj.sunnah.tahajud = i % 3 === 0;
      dayObj.sunnah.witir = i % 2 === 0;

      // Lain
      dayObj.lain.wudhu = true;
      dayObj.lain.sedekah = true;
      dayObj.lain.dzikirPagi = true;
      dayObj.lain.dzikirPetang = !isToday;

      // Quran
      dayObj.quran.tadarusDone = true;
      dayObj.quran.tadarusSurah = i % 2 === 0 ? 'Al-Baqarah' : 'Ali \'Imran';
      dayObj.quran.tadarusAin = String(7 - i);
      
      dayObj.quran.hafalanDone = true;
      dayObj.quran.hafalanSurah = 'An-Naba';
      dayObj.quran.hafalanAyat = `${(6 - i) * 5 + 1}-${(6 - i) * 5 + 5}`;

      dayObj.quran.tadabburDone = true;
      dayObj.quran.tadabburText = 'Merenungi tentang hari pembalasan dan betapa pentingnya menjaga amal kebaikan harian.';

      dayObj.mood = ['bersyukur', 'tenang', 'semangat'][i % 3];
      dayObj.notes = 'Alhamdulillah sholat tepat waktu, hati terasa jauh lebih tenang dan pekerjaan lancar.';
      dayObj.targetBesok = 'Bangun lebih awal untuk sholat Tahajud dan sedekah subuh.';

      data[key] = dayObj;
    }

    return data;
  }

  // --- Confetti Animation ---
  let confettiAnimationId = null;
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10b981', '#f59e0b', '#34d399', '#fbbf24', '#ffffff'];
    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        r: Math.random() * 6 + 3,
        d: Math.random() * 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleInc: (Math.random() * 0.07) + 0.05,
        tiltAngle: 0,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        gravity: 0.35,
        opacity: 1
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);

    let frames = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.tiltAngle += p.tiltAngleInc;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        if (frames > 35) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          alive = true;
          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.moveTo(p.x + p.tilt + p.r, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
          ctx.stroke();
        }
      });

      frames++;
      if (alive && frames < 140) {
        confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(confettiAnimationId);
      }
    }

    render();
  }

  // --- Calculation Helpers ---
  function calculateDayStats(dayData) {
    if (!dayData) return { 
      totalCompleted: 0, percentage: 0, wajibCount: 0, rawatibCount: 0, 
      sunnahCount: 0, totalSunnahCount: 0, shaumCount: 0, hafalanCount: 0,
      bacaQuranCount: 0, lainCount: 0, quranCount: 0, levelRank: 0, 
      rankTitle: 'Memulai Level 1', rankIcon: '🌱' 
    };

    let wajibCount = 0;
    ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].forEach(key => {
      if (dayData.wajib && dayData.wajib[key] && dayData.wajib[key].done) wajibCount++;
    });

    let rawatibCount = 0;
    const rawatibKeys = [
      'qobliyahSubuh',
      'qobliyahDzuhur', 'badiyahDzuhur',
      'qobliyahAshar',
      'qobliyahMaghrib', 'badiyahMaghrib',
      'qobliyahIsya', 'badiyahIsya'
    ];
    rawatibKeys.forEach(key => {
      if (dayData.rawatib && dayData.rawatib[key]) rawatibCount++;
    });

    let sunnahCount = 0;
    ['dhuha', 'tahajud', 'witir'].forEach(key => {
      if (dayData.sunnah && dayData.sunnah[key]) sunnahCount++;
    });

    const totalSunnahCount = rawatibCount + sunnahCount;

    let lainCount = 0;
    ['wudhu', 'sedekah', 'dzikirPagi', 'dzikirPetang'].forEach(key => {
      if (dayData.lain && dayData.lain[key]) lainCount++;
    });

    const bacaQuranCount = (dayData.quran && dayData.quran.tadarusDone) ? 1 : 0;
    const shaumCount = (dayData.shaum && dayData.shaum.puasaHariIni) ? 1 : 0;
    const hafalanCount = (dayData.quran && dayData.quran.hafalanDone) ? 1 : 0;
    const tadabburCount = (dayData.quran && dayData.quran.tadabburDone) ? 1 : 0;

    let quranCount = bacaQuranCount + hafalanCount + tadabburCount;

    const totalCompleted = wajibCount + rawatibCount + sunnahCount + shaumCount + bacaQuranCount + hafalanCount + lainCount;
    const percentage = Math.min(100, Math.round((totalCompleted / TOTAL_DAILY_ITEMS) * 100));

    // Daily Level Rank Evaluation
    const isLevel1 = wajibCount === 5;
    const isLevel2 = isLevel1 && totalSunnahCount >= 1;
    const isLevel3 = isLevel2 && bacaQuranCount === 1;
    const isLevel4 = isLevel3 && shaumCount === 1;
    const isLevel5 = (isLevel4 || (isLevel3 && hafalanCount === 1)) && hafalanCount === 1;

    let levelRank = 0;
    let rankTitle = 'Memulai Level 1: Sholat Wajib';
    let rankIcon = '🌱';

    if (isLevel5) {
      levelRank = 5;
      rankTitle = 'Level 5 Sempurna: Penghafal Al-Qur\'an';
      rankIcon = '👑';
    } else if (isLevel4) {
      levelRank = 4;
      rankTitle = 'Level 4: Jiwa Terjaga Shaum Sunnah';
      rankIcon = '🌙';
    } else if (isLevel3) {
      levelRank = 3;
      rankTitle = 'Level 3: Cahaya Tilawah Al-Qur\'an';
      rankIcon = '📖';
    } else if (isLevel2) {
      levelRank = 2;
      rankTitle = 'Level 2: Sholat Sunnah Bersemai';
      rankIcon = '✨';
    } else if (isLevel1) {
      levelRank = 1;
      rankTitle = 'Level 1: Sholat Wajib Lengkap!';
      rankIcon = '🕌';
    } else if (wajibCount > 0) {
      levelRank = 0;
      rankTitle = `Level 1 Berjalan (${wajibCount}/5 Wajib)`;
      rankIcon = '🕌';
    }

    return { 
      totalCompleted, percentage, wajibCount, rawatibCount, sunnahCount, 
      totalSunnahCount, shaumCount, hafalanCount, bacaQuranCount, lainCount, 
      quranCount, levelRank, rankTitle, rankIcon 
    };
  }

  function calculateStreak() {
    let streak = 0;
    const checkDate = new Date();
    
    // Check today first
    let key = toDateKey(checkDate);
    let todayData = db[key];
    let stats = calculateDayStats(todayData);

    // If today is empty, we check starting from yesterday so streak doesn't immediately drop to 0 in the morning
    if (stats.totalCompleted === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      key = toDateKey(checkDate);
      todayData = db[key];
      stats = calculateDayStats(todayData);
    }

    while (stats && stats.totalCompleted >= 3) { // At least 3 items to qualify as active day
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      key = toDateKey(checkDate);
      todayData = db[key];
      stats = calculateDayStats(todayData);
    }

    return streak;
  }

  // --- Step-by-Step Level Progression & Locking System ---
  let pendingLockedLevel = 2;

  function getLevelProgressionStats() {
    const today = new Date();
    const todayKey = toDateKey(today);
    const activeUser = getActiveUser();

    // Helper to compute backward consecutive streak for a condition
    function computeConsecutive(conditionFn) {
      const todayData = db[todayKey];
      const todayStats = todayData ? calculateDayStats(todayData) : null;
      const isTodayMet = todayStats && conditionFn(todayStats, todayData);

      let checkDate = new Date(today);
      if (!isTodayMet) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      let count = 0;
      const runner = new Date(checkDate);
      for (let i = 0; i < 365; i++) {
        const k = toDateKey(runner);
        const dayData = db[k];
        const st = dayData ? calculateDayStats(dayData) : null;
        if (st && conditionFn(st, dayData)) {
          count++;
          runner.setDate(runner.getDate() - 1);
        } else {
          break;
        }
      }
      return count;
    }

    // Helper to compute historical max consecutive streak
    function computeMaxConsecutive(conditionFn) {
      let max = 0;
      let run = 0;
      const allDateKeys = Object.keys(db).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
      allDateKeys.forEach(k => {
        const st = calculateDayStats(db[k]);
        if (st && conditionFn(st, db[k])) {
          run++;
          if (run > max) max = run;
        } else {
          run = 0;
        }
      });
      return max;
    }

    // ==========================================
    // LEVEL 1: SHOLAT WAJIB (Foundation)
    // Requirement: 10 consecutive days of 5/5 Sholat Wajib
    // ==========================================
    const l1Condition = (st) => st.wajibCount === 5;
    const l1Consecutive = computeConsecutive(l1Condition);
    const l1MaxConsecutive = computeMaxConsecutive(l1Condition);
    const l1Simulated = !!db._level2Unlocked || !!(activeUser && activeUser.level2Unlocked);
    const l1Cleared = (l1Consecutive >= 10 || l1MaxConsecutive >= 10 || l1Simulated);

    const l1Nodes = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = toDateKey(d);
      const dData = db[k];
      const st = dData ? calculateDayStats(dData) : null;
      const wCount = st ? st.wajibCount : 0;
      l1Nodes.push({
        dayIndex: 10 - i,
        dateKey: k,
        dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        dayName: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()],
        isCompleted: wCount === 5,
        isToday: k === todayKey,
        valText: `${wCount}/5`
      });
    }

    // ==========================================
    // LEVEL 2: SHOLAT SUNNAH
    // Requirement: Level 1 cleared + 10 consecutive days with >= 1 Sholat Sunnah
    // ==========================================
    const l2Unlocked = l1Cleared;
    const l2Condition = (st) => st.totalSunnahCount >= 1;
    const l2Consecutive = computeConsecutive(l2Condition);
    const l2MaxConsecutive = computeMaxConsecutive(l2Condition);
    const l2Simulated = !!db._level3Unlocked || !!(activeUser && activeUser.level3Unlocked);
    const l2Cleared = l2Unlocked && (l2Consecutive >= 10 || l2MaxConsecutive >= 10 || l2Simulated);

    const l2Nodes = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = toDateKey(d);
      const dData = db[k];
      const st = dData ? calculateDayStats(dData) : null;
      const sCount = st ? st.totalSunnahCount : 0;
      l2Nodes.push({
        dayIndex: 10 - i,
        dateKey: k,
        dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        dayName: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()],
        isCompleted: sCount >= 1,
        isToday: k === todayKey,
        valText: sCount > 0 ? `${sCount}` : '○'
      });
    }

    // ==========================================
    // LEVEL 3: BACA AL-QUR'AN
    // Requirement: Level 2 cleared + 10 consecutive days with Tilawah / Tadarus
    // ==========================================
    const l3Unlocked = l2Cleared;
    const l3Condition = (st) => st.bacaQuranCount >= 1;
    const l3Consecutive = computeConsecutive(l3Condition);
    const l3MaxConsecutive = computeMaxConsecutive(l3Condition);
    const l3Simulated = !!db._level4Unlocked || !!(activeUser && activeUser.level4Unlocked);
    const l3Cleared = l3Unlocked && (l3Consecutive >= 10 || l3MaxConsecutive >= 10 || l3Simulated);

    const l3Nodes = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = toDateKey(d);
      const dData = db[k];
      const st = dData ? calculateDayStats(dData) : null;
      const qDone = st ? (st.bacaQuranCount >= 1) : false;
      l3Nodes.push({
        dayIndex: 10 - i,
        dateKey: k,
        dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
        dayName: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()],
        isCompleted: qDone,
        isToday: k === todayKey,
        valText: qDone ? '✓' : '○'
      });
    }

    // ==========================================
    // LEVEL 4: SHAUM SUNNAH
    // Requirement: Level 3 cleared + 4 days of Shaum Sunnah logged
    // ==========================================
    const l4Unlocked = l3Cleared;
    let l4TotalDays = 0;
    const allDateKeys = Object.keys(db).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
    allDateKeys.forEach(k => {
      const st = calculateDayStats(db[k]);
      if (st && st.shaumCount >= 1) l4TotalDays++;
    });
    const l4Simulated = !!db._level5Unlocked || !!(activeUser && activeUser.level5Unlocked);
    const l4Cleared = l4Unlocked && (l4TotalDays >= 4 || l4Simulated);

    const l4Nodes = [];
    for (let i = 1; i <= 4; i++) {
      const isDone = l4Simulated || (l4TotalDays >= i);
      l4Nodes.push({
        dayIndex: i,
        isCompleted: isDone,
        valText: isDone ? '✓' : `${i}/4`
      });
    }

    // ==========================================
    // LEVEL 5: HAFALAN AL-QUR'AN PER AYAT
    // Requirement: Level 4 cleared (Pinnacle rank)
    // ==========================================
    const l5Unlocked = l4Cleared;

    return {
      level1: {
        isUnlocked: true,
        isCleared: l1Cleared,
        isSimulated: l1Simulated,
        consecutive: l1Consecutive,
        maxConsecutive: l1MaxConsecutive,
        required: 10,
        remaining: Math.max(0, 10 - l1Consecutive),
        percent: Math.min(100, Math.round((l1Consecutive / 10) * 100)),
        nodes: l1Nodes
      },
      level2: {
        isUnlocked: l2Unlocked,
        isCleared: l2Cleared,
        isSimulated: l2Simulated,
        consecutive: l2Consecutive,
        maxConsecutive: l2MaxConsecutive,
        required: 10,
        remaining: Math.max(0, 10 - l2Consecutive),
        percent: Math.min(100, Math.round((l2Consecutive / 10) * 100)),
        nodes: l2Nodes
      },
      level3: {
        isUnlocked: l3Unlocked,
        isCleared: l3Cleared,
        isSimulated: l3Simulated,
        consecutive: l3Consecutive,
        maxConsecutive: l3MaxConsecutive,
        required: 10,
        remaining: Math.max(0, 10 - l3Consecutive),
        percent: Math.min(100, Math.round((l3Consecutive / 10) * 100)),
        nodes: l3Nodes
      },
      level4: {
        isUnlocked: l4Unlocked,
        isCleared: l4Cleared,
        isSimulated: l4Simulated,
        completedDays: Math.min(4, l4TotalDays),
        required: 4,
        remaining: Math.max(0, 4 - l4TotalDays),
        percent: Math.min(100, Math.round((Math.min(4, l4TotalDays) / 4) * 100)),
        nodes: l4Nodes
      },
      level5: {
        isUnlocked: l5Unlocked,
        isCleared: false
      }
    };
  }

  // Backward compatibility alias for single-level calls
  function getWajibConsistencyStats() {
    const p = getLevelProgressionStats();
    return {
      consecutive: p.level1.consecutive,
      maxConsecutive: p.level1.maxConsecutive,
      isLevel2Unlocked: p.level2.isUnlocked,
      isSimulatedUnlocked: p.level1.isSimulated,
      historyDays: p.level1.nodes,
      required: 10,
      remaining: p.level1.remaining,
      percent: p.level1.percent
    };
  }

  // Multi-level simulation handler
  function simulateUnlockLevel(levelNum, doUnlock) {
    const today = new Date();
    const lvl = parseInt(levelNum, 10);

    if (lvl === 1 || lvl === 2) {
      if (doUnlock) {
        for (let i = 9; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const k = toDateKey(d);
          if (!db[k]) db[k] = getDefaultDayData(k);
          ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].forEach(prayer => {
            if (!db[k].wajib[prayer]) db[k].wajib[prayer] = { done: true, jamaah: true };
            db[k].wajib[prayer].done = true;
          });
          db[k].updatedAt = Date.now();
        }
        db._level2Unlocked = true;
        saveDatabase();
        triggerConfetti();
        playCompleteCelebrationSound();
        showToast('🎉 10 Hari Sholat Wajib lengkap! Level 2 (Sholat Sunnah) kini TERBUKA!');
      } else {
        db._level2Unlocked = false;
        db._level3Unlocked = false;
        db._level4Unlocked = false;
        db._level5Unlocked = false;
        saveDatabase();
        showToast('🔄 Level 2 & tingkat selanjutnya dikunci kembali.');
        playTone(320, 'sine', 0.1, 0.1);
      }
    } else if (lvl === 3) {
      if (doUnlock) {
        db._level2Unlocked = true;
        for (let i = 9; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const k = toDateKey(d);
          if (!db[k]) db[k] = getDefaultDayData(k);
          if (!db[k].sunnah) db[k].sunnah = { dhuha: true, tahajud: false, witir: true };
          else { db[k].sunnah.dhuha = true; db[k].sunnah.witir = true; }
          if (!db[k].rawatib) db[k].rawatib = { qobliyahSubuh: true, badiyahDzuhur: true };
          else { db[k].rawatib.qobliyahSubuh = true; db[k].rawatib.badiyahDzuhur = true; }
          db[k].updatedAt = Date.now();
        }
        db._level3Unlocked = true;
        saveDatabase();
        triggerConfetti();
        playCompleteCelebrationSound();
        showToast('🎉 10 Hari Sholat Sunnah lengkap! Level 3 (Baca Al-Qur\'an) kini TERBUKA!');
      } else {
        db._level3Unlocked = false;
        db._level4Unlocked = false;
        db._level5Unlocked = false;
        saveDatabase();
        showToast('🔄 Level 3 & tingkat selanjutnya dikunci kembali.');
        playTone(320, 'sine', 0.1, 0.1);
      }
    } else if (lvl === 4) {
      if (doUnlock) {
        db._level2Unlocked = true;
        db._level3Unlocked = true;
        for (let i = 9; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const k = toDateKey(d);
          if (!db[k]) db[k] = getDefaultDayData(k);
          if (!db[k].quran) db[k].quran = {};
          db[k].quran.tadarusDone = true;
          db[k].quran.tadarusSurah = 'Al-Baqarah';
          db[k].quran.tadarusAin = '1';
          db[k].updatedAt = Date.now();
        }
        db._level4Unlocked = true;
        saveDatabase();
        triggerConfetti();
        playCompleteCelebrationSound();
        showToast('🎉 10 Hari Tilawah Al-Qur\'an lengkap! Level 4 (Shaum Sunnah) kini TERBUKA!');
      } else {
        db._level4Unlocked = false;
        db._level5Unlocked = false;
        saveDatabase();
        showToast('🔄 Level 4 & tingkat selanjutnya dikunci kembali.');
        playTone(320, 'sine', 0.1, 0.1);
      }
    } else if (lvl === 5) {
      if (doUnlock) {
        db._level2Unlocked = true;
        db._level3Unlocked = true;
        db._level4Unlocked = true;
        for (let i = 3; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - (i * 3));
          const k = toDateKey(d);
          if (!db[k]) db[k] = getDefaultDayData(k);
          if (!db[k].shaum) db[k].shaum = {};
          db[k].shaum.puasaHariIni = true;
          db[k].shaum.jenis = 'senin-kamis';
          db[k].updatedAt = Date.now();
        }
        db._level5Unlocked = true;
        saveDatabase();
        triggerConfetti();
        playCompleteCelebrationSound();
        showToast('👑 MasyaAllah! 4 Hari Shaum Sunnah tuntas. Level 5 (Hafalan Quran) kini TERBUKA!');
      } else {
        db._level5Unlocked = false;
        saveDatabase();
        showToast('🔄 Level 5 dikunci kembali.');
        playTone(320, 'sine', 0.1, 0.1);
      }
    }

    renderJournalForm();
    renderStatsTab();
  }

  function simulateWajib10DaysStreak(doUnlock) {
    simulateUnlockLevel(2, doUnlock);
  }

  // --- Render Visual Consistency Cards for All Levels ---
  function renderAllConsistencyCards(progression) {
    // 1. Level 1 : Sholat Wajib Card
    const l1 = progression.level1;
    const card1 = document.getElementById('wajib-consistency-card');
    if (card1) {
      card1.classList.toggle('unlocked-all', l1.isCleared);
      const lockStatus1 = document.getElementById('consistency-lock-status');
      const lockIcon1 = document.getElementById('consistency-lock-icon');
      const lockLabel1 = document.getElementById('consistency-lock-label');
      const streakText1 = document.getElementById('consistency-streak-text');
      const barFill1 = document.getElementById('consistency-progress-bar-fill');
      const msgIcon1 = document.getElementById('consistency-msg-icon');
      const msgText1 = document.getElementById('consistency-msg-text');
      const stepsGrid1 = document.getElementById('consistency-steps-grid');
      const btnSim1 = document.getElementById('btn-sim-unlock-10d');
      const btnReset1 = document.getElementById('btn-sim-reset-10d');

      if (lockStatus1) lockStatus1.className = `consistency-lock-status ${l1.isCleared ? 'unlocked' : ''}`;
      if (lockIcon1) lockIcon1.textContent = l1.isCleared ? '🔓' : '🔒';
      if (lockLabel1) {
        lockLabel1.textContent = l1.isCleared 
          ? 'Level 2 Terbuka! (10 Hari Sholat Wajib Tuntas)' 
          : `Level 2 Terkunci (Kurang ${l1.remaining} Hari)`;
      }
      if (streakText1) streakText1.textContent = `${l1.consecutive} / 10 Hari (${l1.percent}%)`;
      if (barFill1) barFill1.style.width = `${l1.percent}%`;

      if (msgText1 && msgIcon1) {
        if (l1.isCleared) {
          msgIcon1.textContent = '🌟';
          msgText1.textContent = 'Alhamdulillah! Anda telah mencapai 10 hari istiqomah sholat fardhu tanpa bolong. Level 2 (Sholat Sunnah) kini telah terbuka!';
        } else if (l1.consecutive >= 7) {
          msgIcon1.textContent = '🔥';
          msgText1.textContent = `Luar biasa! Sudah ${l1.consecutive} hari berturut-turut sholat fardhu penuh. Tinggal ${l1.remaining} hari lagi menuju pembukaan Level 2!`;
        } else {
          msgIcon1.textContent = '🌱';
          msgText1.textContent = 'Tunaikan 5 waktu sholat fardhu setiap hari tanpa bolong selama 10 hari berturut-turut untuk membuka Level 2.';
        }
      }

      if (btnSim1 && btnReset1) {
        btnSim1.classList.toggle('hidden', l1.isCleared);
        btnReset1.classList.toggle('hidden', !l1.isCleared);
      }

      if (stepsGrid1) {
        stepsGrid1.innerHTML = '';
        l1.nodes.forEach(item => {
          const node = document.createElement('div');
          const isDone = item.isCompleted;
          const isMissed = !isDone && !item.isToday;
          let stateClass = isDone ? 'completed' : (item.isToday ? 'active-today' : (isMissed ? 'missed' : ''));
          node.className = `consistency-node ${stateClass}`;
          node.title = `${item.dayName}, ${item.dateKey}: ${item.valText} Sholat Wajib`;
          node.innerHTML = `
            <span class="node-num">H-${item.dayIndex}</span>
            <div class="node-icon">${isDone ? '✓' : (item.isToday ? '○' : '✕')}</div>
            <span class="node-date">${item.dateLabel}</span>
          `;
          stepsGrid1.appendChild(node);
        });
      }
    }

    // 2. Level 2 : Sholat Sunnah Card
    const l2 = progression.level2;
    const card2 = document.getElementById('sunnah-consistency-card');
    if (card2) {
      card2.classList.toggle('unlocked-all', l2.isCleared);
      const lockStatus2 = document.getElementById('sunnah-lock-status');
      const lockIcon2 = document.getElementById('sunnah-lock-icon');
      const lockLabel2 = document.getElementById('sunnah-lock-label');
      const streakText2 = document.getElementById('sunnah-streak-text');
      const barFill2 = document.getElementById('sunnah-progress-bar-fill');
      const msgIcon2 = document.getElementById('sunnah-msg-icon');
      const msgText2 = document.getElementById('sunnah-msg-text');
      const stepsGrid2 = document.getElementById('sunnah-steps-grid');
      const btnSim2 = document.getElementById('btn-sim-unlock-l3');
      const btnReset2 = document.getElementById('btn-sim-reset-l3');

      if (lockStatus2) lockStatus2.className = `consistency-lock-status ${l2.isCleared ? 'unlocked' : ''}`;
      if (lockIcon2) lockIcon2.textContent = l2.isCleared ? '🔓' : '🔒';
      if (lockLabel2) {
        lockLabel2.textContent = l2.isCleared 
          ? 'Level 3 Terbuka! (10 Hari Sholat Sunnah Tuntas)' 
          : `Level 3 Terkunci (Kurang ${l2.remaining} Hari)`;
      }
      if (streakText2) streakText2.textContent = `${l2.consecutive} / 10 Hari (${l2.percent}%)`;
      if (barFill2) barFill2.style.width = `${l2.percent}%`;

      if (msgText2 && msgIcon2) {
        if (l2.isCleared) {
          msgIcon2.textContent = '🌟';
          msgText2.textContent = 'MasyaAllah! Istiqomah 10 hari sholat sunnah telah tercapai. Level 3 (Baca Al-Qur\'an) kini terbuka!';
        } else if (l2.consecutive >= 5) {
          msgIcon2.textContent = '🔥';
          msgText2.textContent = `Hebat! ${l2.consecutive} hari sholat sunnah beruntun. Kurang ${l2.remaining} hari lagi untuk membuka Level 3.`;
        } else {
          msgIcon2.textContent = '✨';
          msgText2.textContent = 'Amalkan minimal 1 sholat sunnah (Rawatib, Dhuha, Tahajud, atau Witir) setiap hari selama 10 hari berturut-turut.';
        }
      }

      if (btnSim2 && btnReset2) {
        btnSim2.classList.toggle('hidden', l2.isCleared);
        btnReset2.classList.toggle('hidden', !l2.isCleared);
      }

      if (stepsGrid2) {
        stepsGrid2.innerHTML = '';
        l2.nodes.forEach(item => {
          const node = document.createElement('div');
          const isDone = item.isCompleted;
          const isMissed = !isDone && !item.isToday;
          let stateClass = isDone ? 'completed' : (item.isToday ? 'active-today' : (isMissed ? 'missed' : ''));
          node.className = `consistency-node ${stateClass}`;
          node.title = `${item.dayName}, ${item.dateKey}: ${item.valText} Sholat Sunnah`;
          node.innerHTML = `
            <span class="node-num">H-${item.dayIndex}</span>
            <div class="node-icon gold-icon">${isDone ? '✓' : (item.isToday ? '○' : '✕')}</div>
            <span class="node-date">${item.dateLabel}</span>
          `;
          stepsGrid2.appendChild(node);
        });
      }
    }

    // 3. Level 3 : Baca Quran Card
    const l3 = progression.level3;
    const card3 = document.getElementById('quran-consistency-card');
    if (card3) {
      card3.classList.toggle('unlocked-all', l3.isCleared);
      const lockStatus3 = document.getElementById('quran-lock-status');
      const lockIcon3 = document.getElementById('quran-lock-icon');
      const lockLabel3 = document.getElementById('quran-lock-label');
      const streakText3 = document.getElementById('quran-streak-text');
      const barFill3 = document.getElementById('quran-progress-bar-fill');
      const msgIcon3 = document.getElementById('quran-msg-icon');
      const msgText3 = document.getElementById('quran-msg-text');
      const stepsGrid3 = document.getElementById('quran-steps-grid');
      const btnSim3 = document.getElementById('btn-sim-unlock-l4');
      const btnReset3 = document.getElementById('btn-sim-reset-l4');

      if (lockStatus3) lockStatus3.className = `consistency-lock-status ${l3.isCleared ? 'unlocked' : ''}`;
      if (lockIcon3) lockIcon3.textContent = l3.isCleared ? '🔓' : '🔒';
      if (lockLabel3) {
        lockLabel3.textContent = l3.isCleared 
          ? 'Level 4 Terbuka! (10 Hari Tilawah Tuntas)' 
          : `Level 4 Terkunci (Kurang ${l3.remaining} Hari)`;
      }
      if (streakText3) streakText3.textContent = `${l3.consecutive} / 10 Hari (${l3.percent}%)`;
      if (barFill3) barFill3.style.width = `${l3.percent}%`;

      if (msgText3 && msgIcon3) {
        if (l3.isCleared) {
          msgIcon3.textContent = '🌟';
          msgText3.textContent = 'Alhamdulillah! Tilawah Al-Qur\'an 10 hari berturut-turut lengkap. Level 4 (Shaum Sunnah) kini terbuka!';
        } else {
          msgIcon3.textContent = '📖';
          msgText3.textContent = 'Bacalah Al-Qur\'an minimal 1 \'ain / 1 halaman setiap hari selama 10 hari berturut-turut tanpa jeda.';
        }
      }

      if (btnSim3 && btnReset3) {
        btnSim3.classList.toggle('hidden', l3.isCleared);
        btnReset3.classList.toggle('hidden', !l3.isCleared);
      }

      if (stepsGrid3) {
        stepsGrid3.innerHTML = '';
        l3.nodes.forEach(item => {
          const node = document.createElement('div');
          const isDone = item.isCompleted;
          const isMissed = !isDone && !item.isToday;
          let stateClass = isDone ? 'completed' : (item.isToday ? 'active-today' : (isMissed ? 'missed' : ''));
          node.className = `consistency-node ${stateClass}`;
          node.title = `${item.dayName}, ${item.dateKey}: ${isDone ? 'Tilawah Selesai' : 'Belum Tilawah'}`;
          node.innerHTML = `
            <span class="node-num">H-${item.dayIndex}</span>
            <div class="node-icon cyan-icon">${isDone ? '✓' : (item.isToday ? '○' : '✕')}</div>
            <span class="node-date">${item.dateLabel}</span>
          `;
          stepsGrid3.appendChild(node);
        });
      }
    }

    // 4. Level 4 : Shaum Sunnah Card
    const l4 = progression.level4;
    const card4 = document.getElementById('shaum-consistency-card');
    if (card4) {
      card4.classList.toggle('unlocked-all', l4.isCleared);
      const lockStatus4 = document.getElementById('shaum-lock-status');
      const lockIcon4 = document.getElementById('shaum-lock-icon');
      const lockLabel4 = document.getElementById('shaum-lock-label');
      const streakText4 = document.getElementById('shaum-streak-text');
      const barFill4 = document.getElementById('shaum-progress-bar-fill');
      const msgIcon4 = document.getElementById('shaum-msg-icon');
      const msgText4 = document.getElementById('shaum-msg-text');
      const stepsGrid4 = document.getElementById('shaum-steps-grid');
      const btnSim4 = document.getElementById('btn-sim-unlock-l5');
      const btnReset4 = document.getElementById('btn-sim-reset-l5');

      if (lockStatus4) lockStatus4.className = `consistency-lock-status ${l4.isCleared ? 'unlocked' : ''}`;
      if (lockIcon4) lockIcon4.textContent = l4.isCleared ? '🔓' : '🔒';
      if (lockLabel4) {
        lockLabel4.textContent = l4.isCleared 
          ? 'Level 5 Terbuka! (4 Hari Shaum Tuntas)' 
          : `Level 5 Terkunci (Kurang ${l4.remaining} Hari)`;
      }
      if (streakText4) streakText4.textContent = `${l4.completedDays} / 4 Hari (${l4.percent}%)`;
      if (barFill4) barFill4.style.width = `${l4.percent}%`;

      if (msgText4 && msgIcon4) {
        if (l4.isCleared) {
          msgIcon4.textContent = '👑';
          msgText4.textContent = 'MasyaAllah! Anda telah menyelesaikan 4 hari shaum sunnah. Mahkota Level 5 (Hafalan Quran Per Ayat) kini terbuka!';
        } else {
          msgIcon4.textContent = '🌙';
          msgText4.textContent = 'Tuntaskan shaum sunnah (Senin & Kamis atau Yaumul Bidh 13, 14, 15 H) sebanyak 4 hari untuk membuka Level 5.';
        }
      }

      if (btnSim4 && btnReset4) {
        btnSim4.classList.toggle('hidden', l4.isCleared);
        btnReset4.classList.toggle('hidden', !l4.isCleared);
      }

      if (stepsGrid4) {
        stepsGrid4.innerHTML = '';
        l4.nodes.forEach(item => {
          const node = document.createElement('div');
          const isDone = item.isCompleted;
          node.className = `consistency-node ${isDone ? 'completed' : ''}`;
          node.title = `Hari Shaum ke-${item.dayIndex}: ${isDone ? 'Selesai' : 'Belum'}`;
          node.innerHTML = `
            <span class="node-num">Hari ke-${item.dayIndex}</span>
            <div class="node-icon purple-icon">${isDone ? '✓' : '○'}</div>
            <span class="node-date">${isDone ? 'Tuntas' : 'Target'}</span>
          `;
          stepsGrid4.appendChild(node);
        });
      }
    }

    // 5. Level 5 : Pinnacle Card
    const card5 = document.getElementById('hafalan-pinnacle-card');
    if (card5) {
      card5.classList.toggle('unlocked-all', progression.level5.isUnlocked);
    }
  }

  // --- Update Stepper & Panels Locking State Across All Levels ---
  function updateAllLevelLockingUI(progression) {
    const isL2Open = progression.level2.isUnlocked;
    const isL3Open = progression.level3.isUnlocked;
    const isL4Open = progression.level4.isUnlocked;
    const isL5Open = progression.level5.isUnlocked;

    // 1. Stepper Badges & Lock State
    const stepConfig = [
      { step: 2, isOpen: isL2Open, title: `Level 2 Terkunci: Butuh 10 Hari Sholat Wajib Penuh (${progression.level1.consecutive}/10 Hari)` },
      { step: 3, isOpen: isL3Open, title: `Level 3 Terkunci: Butuh 10 Hari Sholat Sunnah Penuh (${progression.level2.consecutive}/10 Hari)` },
      { step: 4, isOpen: isL4Open, title: `Level 4 Terkunci: Butuh 10 Hari Tilawah Al-Qur'an Penuh (${progression.level3.consecutive}/10 Hari)` },
      { step: 5, isOpen: isL5Open, title: `Level 5 Terkunci: Butuh 4 Hari Shaum Sunnah (${progression.level4.completedDays}/4 Hari)` }
    ];

    stepConfig.forEach(cfg => {
      const stepBtn = document.querySelector(`.level-step-card[data-step="${cfg.step}"]`);
      if (stepBtn) {
        stepBtn.classList.toggle('locked', !cfg.isOpen);
        const ind = stepBtn.querySelector('.step-status-indicator');
        const badge = stepBtn.querySelector('.step-badge');
        if (!cfg.isOpen) {
          stepBtn.setAttribute('title', cfg.title);
          if (badge) badge.textContent = '🔒';
          if (ind) ind.textContent = '🔒 Kunci';
        } else {
          stepBtn.removeAttribute('title');
          if (badge) badge.textContent = String(cfg.step);
        }
      }
    });

    // 2. Panels Locked Overlay State
    [
      { step: 2, isOpen: isL2Open },
      { step: 3, isOpen: isL3Open },
      { step: 4, isOpen: isL4Open },
      { step: 5, isOpen: isL5Open }
    ].forEach(p => {
      const panel = document.getElementById(`panel-level-${p.step}`);
      if (panel) {
        panel.classList.toggle('is-locked', !p.isOpen);
      }
    });

    // 3. Update locked banner text inside panels
    // Panel 2 Banner (Prerequisite: Level 1)
    const s2 = document.getElementById('locked-banner-streak-2');
    const f2 = document.getElementById('locked-progress-fill-2');
    const h2 = document.getElementById('locked-progress-hint-2');
    if (s2) s2.textContent = `${progression.level1.consecutive} / 10 Hari (${progression.level1.percent}%)`;
    if (f2) f2.style.width = `${progression.level1.percent}%`;
    if (h2) h2.textContent = progression.level1.remaining > 0 ? `Kurang ${progression.level1.remaining} hari lagi sholat fardhu lengkap 5 waktu.` : `Target 10 hari sholat wajib tercapai!`;

    // Panel 3 Banner (Prerequisite: Level 2)
    const s3 = document.getElementById('locked-banner-streak-3');
    const f3 = document.getElementById('locked-progress-fill-3');
    const h3 = document.getElementById('locked-progress-hint-3');
    if (s3) s3.textContent = `${progression.level2.consecutive} / 10 Hari (${progression.level2.percent}%)`;
    if (f3) f3.style.width = `${progression.level2.percent}%`;
    if (h3) h3.textContent = progression.level2.remaining > 0 ? `Kurang ${progression.level2.remaining} hari lagi sholat sunnah di Level 2.` : `Target 10 hari sholat sunnah tercapai!`;

    // Panel 4 Banner (Prerequisite: Level 3)
    const s4 = document.getElementById('locked-banner-streak-4');
    const f4 = document.getElementById('locked-progress-fill-4');
    const h4 = document.getElementById('locked-progress-hint-4');
    if (s4) s4.textContent = `${progression.level3.consecutive} / 10 Hari (${progression.level3.percent}%)`;
    if (f4) f4.style.width = `${progression.level3.percent}%`;
    if (h4) h4.textContent = progression.level3.remaining > 0 ? `Kurang ${progression.level3.remaining} hari lagi tilawah di Level 3.` : `Target 10 hari tilawah Al-Qur'an tercapai!`;

    // Panel 5 Banner (Prerequisite: Level 4)
    const s5 = document.getElementById('locked-banner-streak-5');
    const f5 = document.getElementById('locked-progress-fill-5');
    const h5 = document.getElementById('locked-progress-hint-5');
    if (s5) s5.textContent = `${progression.level4.completedDays} / 4 Hari (${progression.level4.percent}%)`;
    if (f5) f5.style.width = `${progression.level4.percent}%`;
    if (h5) h5.textContent = progression.level4.remaining > 0 ? `Kurang ${progression.level4.remaining} hari lagi shaum sunnah di Level 4.` : `Target 4 hari shaum sunnah tercapai!`;

    // 4. Footer Next Buttons on Each Level
    const btnNext1 = document.getElementById('btn-next-from-level1');
    const lblNext1 = document.getElementById('btn-next-level1-label');
    if (btnNext1) {
      btnNext1.classList.toggle('locked', !isL2Open);
      if (lblNext1) lblNext1.textContent = !isL2Open ? `🔒 Level 2 Terkunci (${progression.level1.consecutive}/10 Hari)` : `Lanjut Level 2: Sholat Sunnah`;
    }

    const btnNext2 = document.getElementById('btn-next-from-level2');
    const lblNext2 = document.getElementById('btn-next-level2-label');
    if (btnNext2) {
      btnNext2.classList.toggle('locked', !isL3Open);
      if (lblNext2) lblNext2.textContent = !isL3Open ? `🔒 Level 3 Terkunci (${progression.level2.consecutive}/10 Hari)` : `Lanjut Level 3: Baca Al-Qur'an`;
    }

    const btnNext3 = document.getElementById('btn-next-from-level3');
    const lblNext3 = document.getElementById('btn-next-level3-label');
    if (btnNext3) {
      btnNext3.classList.toggle('locked', !isL4Open);
      if (lblNext3) lblNext3.textContent = !isL4Open ? `🔒 Level 4 Terkunci (${progression.level3.consecutive}/10 Hari)` : `Lanjut Level 4: Shaum Sunnah`;
    }

    const btnNext4 = document.getElementById('btn-next-from-level4');
    const lblNext4 = document.getElementById('btn-next-level4-label');
    if (btnNext4) {
      btnNext4.classList.toggle('locked', !isL5Open);
      if (lblNext4) lblNext4.textContent = !isL5Open ? `🔒 Level 5 Terkunci (${progression.level4.completedDays}/4 Hari)` : `Lanjut Level 5: Hafalan Quran`;
    }
  }

  function updateLevelLockingUI(stats) {
    const progression = getLevelProgressionStats();
    updateAllLevelLockingUI(progression);
  }

  // --- Dynamic Locked Modal Trigger ---
  function openLockedModal(targetLevel) {
    pendingLockedLevel = targetLevel;
    const progression = getLevelProgressionStats();
    const modal = document.getElementById('modal-level-locked');
    if (!modal) return;

    const titleEl = document.getElementById('locked-modal-title');
    const descEl = document.getElementById('locked-modal-desc');
    const streakEl = document.getElementById('locked-modal-current-streak');
    const btnBack = document.getElementById('btn-locked-back-to-level1');
    const btnSim = document.getElementById('btn-sim-unlock-from-modal');

    if (targetLevel === 2) {
      if (titleEl) titleEl.textContent = 'Level 2 : Sholat Sunnah Masih Terkunci! 🔒';
      if (descEl) {
        descEl.innerHTML = `Tingkatan Sholat Sunnah belum bisa dibuka. Selesaikan <strong>Sholat Wajib 5 waktu selama 10 hari berturut-turut tanpa bolong</strong> di Level 1 untuk membuka kunci tingkatan ini. Rekor Anda saat ini: <strong>${progression.level1.consecutive} dari 10 hari</strong>.`;
      }
      if (streakEl) streakEl.textContent = `${progression.level1.consecutive} / 10 Hari`;
      if (btnBack) btnBack.innerHTML = `<span>👉 Kerjakan Sholat Wajib (Level 1)</span>`;
      if (btnSim) btnSim.innerHTML = `<span>⚡ Buka Kunci Level 2 (Simulasi)</span>`;
    } else if (targetLevel === 3) {
      if (titleEl) titleEl.textContent = 'Level 3 : Baca Al-Qur\'an Masih Terkunci! 🔒';
      if (descEl) {
        descEl.innerHTML = `Tingkatan Tilawah Al-Qur'an belum bisa dibuka. Selesaikan <strong>Sholat Sunnah selama 10 hari berturut-turut</strong> di Level 2 untuk membuka kunci tingkatan ini. Rekor Anda saat ini: <strong>${progression.level2.consecutive} dari 10 hari</strong>.`;
      }
      if (streakEl) streakEl.textContent = `${progression.level2.consecutive} / 10 Hari`;
      if (btnBack) btnBack.innerHTML = `<span>👉 Kerjakan Sholat Sunnah (Level 2)</span>`;
      if (btnSim) btnSim.innerHTML = `<span>⚡ Buka Kunci Level 3 (Simulasi)</span>`;
    } else if (targetLevel === 4) {
      if (titleEl) titleEl.textContent = 'Level 4 : Shaum Sunnah Masih Terkunci! 🔒';
      if (descEl) {
        descEl.innerHTML = `Tingkatan Shaum Sunnah belum bisa dibuka. Selesaikan <strong>Tilawah Al-Qur'an selama 10 hari berturut-turut</strong> di Level 3 untuk membuka kunci tingkatan ini. Rekor Anda saat ini: <strong>${progression.level3.consecutive} dari 10 hari</strong>.`;
      }
      if (streakEl) streakEl.textContent = `${progression.level3.consecutive} / 10 Hari`;
      if (btnBack) btnBack.innerHTML = `<span>👉 Kerjakan Tilawah Quran (Level 3)</span>`;
      if (btnSim) btnSim.innerHTML = `<span>⚡ Buka Kunci Level 4 (Simulasi)</span>`;
    } else if (targetLevel === 5) {
      if (titleEl) titleEl.textContent = 'Level 5 : Hafalan Al-Qur\'an Masih Terkunci! 🔒';
      if (descEl) {
        descEl.innerHTML = `Mahkota Penghafal Al-Qur'an belum bisa dibuka. Laksanakan <strong>Shaum Sunnah minimal 4 hari (Senin & Kamis / Yaumul Bidh)</strong> di Level 4 untuk membuka kunci tingkatan ini. Capaian Anda saat ini: <strong>${progression.level4.completedDays} dari 4 hari shaum</strong>.`;
      }
      if (streakEl) streakEl.textContent = `${progression.level4.completedDays} / 4 Hari`;
      if (btnBack) btnBack.innerHTML = `<span>👉 Laksanakan Shaum (Level 4)</span>`;
      if (btnSim) btnSim.innerHTML = `<span>⚡ Buka Kunci Level 5 (Simulasi)</span>`;
    }

    modal.classList.remove('hidden');
    playTone(280, 'sawtooth', 0.16, 0.12);
  }


  // --- UI Elements ---
  const elDateDisplay = document.getElementById('gregorian-date-label');
  const elHijriDisplay = document.getElementById('hijri-date-label');
  const elNativeDate = document.getElementById('native-date-input');
  const elStreakCount = document.getElementById('streak-count');
  const elStatsStreakVal = document.getElementById('stats-streak-val');

  const elProgressCircle = document.getElementById('daily-progress-circle');
  const elProgressPercent = document.getElementById('progress-percentage-text');
  const elProgressHeadline = document.getElementById('progress-hero-headline');
  const elProgressSub = document.getElementById('progress-hero-sub');
  const elDailyBadge = document.getElementById('daily-status-badge');

  const elMiniWajib = document.getElementById('mini-wajib-count');
  const elMiniRawatib = document.getElementById('mini-rawatib-count');
  const elMiniSunnah = document.getElementById('mini-sunnah-count');
  const elMiniQuran = document.getElementById('mini-quran-count');
  const elMiniShaum = document.getElementById('mini-shaum-count');
  const elMiniHafalan = document.getElementById('mini-hafalan-count');
  const elMiniLain = document.getElementById('mini-lain-count');

  const elBadgeWajib = document.getElementById('badge-wajib');
  const elBadgeRawatib = document.getElementById('badge-rawatib');
  const elBadgeSunnah = document.getElementById('badge-sunnah');
  const elBadgeLain = document.getElementById('badge-lain');
  const elBadgeQuran = document.getElementById('badge-quran');
  const elBadgeShaum = document.getElementById('badge-shaum');
  const elBadgeHafalan = document.getElementById('badge-hafalan');

  const elDailyLevelRankPill = document.getElementById('daily-level-rank-pill');
  const elDailyLevelRankText = document.getElementById('daily-level-rank-text');

  // Inputs
  const elTadarusSurah = document.getElementById('quran-tadarus-surah');
  const elTadarusAin = document.getElementById('quran-tadarus-ain');
  const elHafalanSurah = document.getElementById('quran-hafalan-surah');
  const elHafalanAyat = document.getElementById('quran-hafalan-ayat');
  const elHafalanStart = document.getElementById('hafalan-ayat-start');
  const elHafalanEnd = document.getElementById('hafalan-ayat-end');
  const elHafalanStatus = document.getElementById('hafalan-status-select');
  const elTadabburText = document.getElementById('quran-tadabbur-text');
  const elNotes = document.getElementById('journal-notes');
  const elTargetBesok = document.getElementById('journal-target-besok');
  const elToast = document.getElementById('save-status-toast');

  let activeLevelStep = 1;
  let isAllLevelsViewMode = false;

  let wasFullCompleteCelebrated = false;

  // --- Render UI ---
  function renderAll() {
    renderUsersUI();
    renderDateHeaders();
    renderJournalForm();
    renderQuranCatalog();
    renderStatsTab();
    renderHistoryTab();
  }

  let isAdminSessionActive = false;

  function isSuperUser() {
    if (isAdminSessionActive) return true;
    const activeUser = getActiveUser();
    if (activeUser && (activeUser.role === 'super_admin' || activeUser.role === 'admin')) {
      return true;
    }
    const users = getUsersDatabase();
    if (activeUser && users.length > 0 && String(users[0].id) === String(activeUser.id)) {
      return true;
    }
    return false;
  }

  function renderUsersUI() {
    const activeUser = getActiveUser();
    const isSuper = isSuperUser();
    const btnOpenUserModal = document.getElementById('btn-open-user-modal');
    const userProfileBadge = document.getElementById('user-profile-badge');
    const userNameText = document.getElementById('user-display-name');
    const userAvatarFallback = document.getElementById('user-avatar-fallback');

    if (activeUser) {
      btnOpenUserModal?.classList.add('hidden');
      userProfileBadge?.classList.remove('hidden');

      if (userNameText) {
        userNameText.textContent = activeUser.name.split(' ')[0];
      }
      if (userAvatarFallback) {
        userAvatarFallback.textContent = activeUser.name.charAt(0).toUpperCase();
      }
    } else {
      btnOpenUserModal?.classList.remove('hidden');
      userProfileBadge?.classList.add('hidden');
    }

    // Modal Active User Banner
    const activeBanner = document.getElementById('active-user-banner');
    const bannerAvatar = document.getElementById('banner-user-avatar');
    const bannerName = document.getElementById('banner-user-name');
    const bannerEmail = document.getElementById('banner-user-email');
    const bannerRole = document.getElementById('banner-user-role-badge');

    if (activeUser) {
      activeBanner?.classList.remove('hidden');
      if (bannerAvatar) bannerAvatar.textContent = activeUser.name.charAt(0).toUpperCase();
      if (bannerName) bannerName.textContent = activeUser.name;
      if (bannerEmail) bannerEmail.textContent = activeUser.email;
      if (bannerRole) {
        if (isSuper) {
          bannerRole.textContent = '👑 Super User (Admin)';
          bannerRole.className = 'user-role-badge';
        } else {
          bannerRole.textContent = '👤 Pengguna';
          bannerRole.className = 'user-role-badge regular';
        }
      }
    } else {
      activeBanner?.classList.add('hidden');
    }

    // 1. Regular User Modal List (#registered-users-list)
    const users = getUsersDatabase();
    const countBadge = document.getElementById('registered-users-count');
    const usersListContainer = document.getElementById('registered-users-list');
    const noUsersNotice = document.getElementById('no-users-notice');

    if (countBadge) {
      countBadge.textContent = `${users.length} Pengguna`;
    }

    if (usersListContainer) {
      usersListContainer.innerHTML = '';
      if (users.length === 0) {
        noUsersNotice?.classList.remove('hidden');
      } else {
        noUsersNotice?.classList.add('hidden');
        users.forEach((u, idx) => {
          const isActive = activeUser && String(activeUser.id) === String(u.id);
          const initial = (u.name || 'U').charAt(0).toUpperCase();
          const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          const isUserSuperAdmin = u.role === 'super_admin' || idx === 0;

          const item = document.createElement('div');
          item.className = `user-card-item ${isActive ? 'active-user-item' : ''}`;
          item.innerHTML = `
            <div class="user-card-left">
              <div class="user-card-avatar">${initial}</div>
              <div class="user-card-details">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="user-card-name">${escapeHTML(u.name)}</span>
                  ${isUserSuperAdmin ? `<span class="user-role-badge" style="font-size:0.6rem; padding:1px 5px;">👑 Admin</span>` : ''}
                </div>
                <span class="user-card-email">${escapeHTML(u.email)}${dateStr ? ` &bull; ${dateStr}` : ''}</span>
              </div>
            </div>
            <div class="user-card-actions">
              ${isActive 
                ? `<span class="badge-is-active">✓ Aktif</span>`
                : `<button type="button" class="btn-select-user" data-id="${u.id}">Pilih ➔</button>`
              }
            </div>
          `;

          item.querySelector('.btn-select-user')?.addEventListener('click', (e) => {
            e.stopPropagation();
            promptPasswordForUser(u.id);
          });

          usersListContainer.appendChild(item);
        });
      }
    }

    // 2. Super User Admin Panel List (#admin-registered-users-list)
    const adminCountBadge = document.getElementById('admin-registered-users-count');
    const adminUsersList = document.getElementById('admin-registered-users-list');

    if (adminCountBadge) {
      adminCountBadge.textContent = `${users.length} Pengguna`;
    }

    if (adminUsersList) {
      adminUsersList.innerHTML = '';
      if (users.length === 0) {
        adminUsersList.innerHTML = '<div class="no-users-notice">Belum ada akun pengguna terdaftar.</div>';
      } else {
        users.forEach((u, idx) => {
          const isActive = activeUser && String(activeUser.id) === String(u.id);
          const initial = (u.name || 'U').charAt(0).toUpperCase();
          const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          const isUserSuperAdmin = u.role === 'super_admin' || idx === 0;

          const item = document.createElement('div');
          item.className = `user-card-item ${isActive ? 'active-user-item' : ''}`;
          item.innerHTML = `
            <div class="user-card-left">
              <div class="user-card-avatar" style="${isUserSuperAdmin ? 'border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.15); color: var(--accent-gold-light);' : ''}">${initial}</div>
              <div class="user-card-details">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="user-card-name">${escapeHTML(u.name)}</span>
                  ${isUserSuperAdmin 
                    ? `<span class="user-role-badge">👑 Super Admin</span>` 
                    : `<span class="user-role-badge regular">👤 Pengguna</span>`
                  }
                </div>
                <span class="user-card-email">${escapeHTML(u.email)}${dateStr ? ` &bull; ${dateStr}` : ''}</span>
              </div>
            </div>
            <div class="user-card-actions">
              ${isActive ? `<span class="badge-is-active">✓ Aktif</span>` : ''}
              <button type="button" class="btn-delete-user" data-id="${u.id}" title="Hapus pengguna '${escapeHTML(u.name)}'">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          `;

          item.querySelector('.btn-delete-user')?.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteUser(u.id);
          });

          adminUsersList.appendChild(item);
        });
      }
    }
  }

  async function openAdminPanel() {
    const modalAdminPanel = document.getElementById('modal-admin-panel');
    if (!modalAdminPanel) return;
    modalAdminPanel.classList.remove('hidden');
    const urlInput = document.getElementById('input-gsheet-url');
    if (urlInput) urlInput.value = getGSheetUrl();
    renderUsersUI();
    await checkBackendStatus();
    await syncUsersFromBackend();
    renderUsersUI();
  }

  function renderDateHeaders() {
    elDateDisplay.textContent = formatGregorianIndo(currentDate);
    elHijriDisplay.textContent = getHijriDate(currentDate);
    elNativeDate.value = toDateKey(currentDate);

    const streak = calculateStreak();
    elStreakCount.textContent = streak;
    if (elStatsStreakVal) elStatsStreakVal.textContent = streak;
  }

  function renderJournalForm() {
    const data = getCurrentDayData();
    const stats = calculateDayStats(data);

    // 1. Progress Ring
    const radius = 35;
    const circumference = 2 * Math.PI * radius; // ~219.9
    const offset = circumference - (stats.percentage / 100) * circumference;
    elProgressCircle.style.strokeDashoffset = offset;
    elProgressPercent.textContent = `${stats.percentage}%`;

    // Dynamic Headline & Badges based on score
    if (stats.percentage === 100) {
      elDailyBadge.textContent = '🌟 Sempurna! MasyaAllah';
      elDailyBadge.style.color = 'var(--accent-gold-light)';
      elProgressHeadline.textContent = 'Ibadah Hari Ini Lengkap!';
      elProgressSub.textContent = 'Semoga Allah menerima seluruh amal ibadahmu hari ini.';
      elProgressCircle.classList.add('complete');

      if (!wasFullCompleteCelebrated) {
        triggerConfetti();
        playCompleteCelebrationSound();
        wasFullCompleteCelebrated = true;
      }
    } else if (stats.percentage >= 70) {
      elDailyBadge.textContent = '✨ Sangat Baik';
      elDailyBadge.style.color = 'var(--accent-emerald-light)';
      elProgressHeadline.textContent = 'Hampir Sempurna!';
      elProgressSub.textContent = 'Tuntaskan sedikit lagi amalan hari ini untuk pahala maksimal.';
      elProgressCircle.classList.remove('complete');
      wasFullCompleteCelebrated = false;
    } else if (stats.percentage >= 40) {
      elDailyBadge.textContent = '🌿 Sedang Berjalan';
      elDailyBadge.style.color = 'var(--accent-emerald-light)';
      elProgressHeadline.textContent = 'Terus Jaga Konsistensi';
      elProgressSub.textContent = 'Luangkan waktu untuk tilawah Quran & sholat sunnah.';
      elProgressCircle.classList.remove('complete');
      wasFullCompleteCelebrated = false;
    } else if (stats.percentage > 0) {
      elDailyBadge.textContent = '🌱 Awal yang Baik';
      elDailyBadge.style.color = 'var(--accent-emerald-light)';
      elProgressHeadline.textContent = 'Lanjutkan Amalanmu';
      elProgressSub.textContent = 'Jaga sholat 5 waktu dan jangan lupa tadarus.';
      elProgressCircle.classList.remove('complete');
      wasFullCompleteCelebrated = false;
    } else {
      const activeUser = getActiveUser();
      if (activeUser) {
        elDailyBadge.textContent = `👋 Assalamu'alaikum, ${activeUser.name.split(' ')[0]}`;
        elDailyBadge.style.color = 'var(--accent-emerald-light)';
        elProgressHeadline.textContent = 'Mulai Catatan Hari Ini';
        elProgressSub.textContent = 'Centang amalan wajib & sunnah yang telah kamu laksanakan.';
      } else {
        elDailyBadge.textContent = 'Mulai Hari Baru';
        elDailyBadge.style.color = 'var(--text-muted)';
        elProgressHeadline.textContent = 'Belum Ada Amalan Tercatat';
        elProgressSub.textContent = 'Centang ibadah yang telah kamu laksanakan hari ini.';
      }
      elProgressCircle.classList.remove('complete');
      wasFullCompleteCelebrated = false;
    }

    // Daily Level Rank Pill
    if (elDailyLevelRankText) {
      elDailyLevelRankText.textContent = `Tingkat Ibadah: ${stats.rankTitle}`;
    }
    if (elDailyLevelRankPill) {
      const starEl = elDailyLevelRankPill.querySelector('.rank-star');
      if (starEl) starEl.textContent = stats.rankIcon;
    }

    // Mini Counters (5 Levels)
    if (elMiniWajib) elMiniWajib.textContent = `${stats.wajibCount}/5`;
    if (elMiniRawatib) elMiniRawatib.textContent = `${stats.rawatibCount}/8`;
    if (elMiniSunnah) elMiniSunnah.textContent = `${stats.totalSunnahCount}/11`;
    if (elMiniQuran) elMiniQuran.textContent = `${stats.bacaQuranCount}/1`;
    if (elMiniShaum) elMiniShaum.textContent = `${stats.shaumCount ? 'Puasa ✓' : '-'}`;
    if (elMiniHafalan) {
      const memCount = (data.quran?.hafalanAyatList && data.quran.hafalanAyatList.length) || (stats.hafalanCount ? 1 : 0);
      elMiniHafalan.textContent = `${memCount} Ayat`;
    }
    if (elMiniLain) elMiniLain.textContent = `${stats.lainCount}/4`;

    // Stepper Track Indicators
    const ind1 = document.getElementById('step-ind-1');
    const ind2 = document.getElementById('step-ind-2');
    const ind3 = document.getElementById('step-ind-3');
    const ind4 = document.getElementById('step-ind-4');
    const ind5 = document.getElementById('step-ind-5');
    const ind6 = document.getElementById('step-ind-6');

    if (ind1) ind1.textContent = `${stats.wajibCount}/5`;
    if (ind2) ind2.textContent = `${stats.totalSunnahCount}/11`;
    if (ind3) ind3.textContent = stats.bacaQuranCount ? '✓' : '0/1';
    if (ind4) ind4.textContent = stats.shaumCount ? 'Puasa ✓' : '-';
    if (ind5) ind5.textContent = stats.hafalanCount ? '✓' : '0/1';
    if (ind6) ind6.textContent = (data.notes || data.mood) ? '✓' : 'Amalan';

    document.querySelector('.level-step-card[data-step="1"]')?.classList.toggle('completed', stats.wajibCount === 5);
    document.querySelector('.level-step-card[data-step="2"]')?.classList.toggle('completed', stats.totalSunnahCount >= 1);
    document.querySelector('.level-step-card[data-step="3"]')?.classList.toggle('completed', stats.bacaQuranCount === 1);
    document.querySelector('.level-step-card[data-step="4"]')?.classList.toggle('completed', stats.shaumCount === 1);
    document.querySelector('.level-step-card[data-step="5"]')?.classList.toggle('completed', stats.hafalanCount === 1);
    document.querySelector('.level-step-card[data-step="6"]')?.classList.toggle('completed', !!(data.notes || data.mood));

    // Multi-Level Step-by-Step Consistency Challenge & Level Locking
    const progression = getLevelProgressionStats();
    renderAllConsistencyCards(progression);
    updateAllLevelLockingUI(progression);

    // Section Counters Badges
    if (elBadgeWajib) {
      elBadgeWajib.textContent = `${stats.wajibCount}/5`;
      elBadgeWajib.classList.toggle('done', stats.wajibCount === 5);
    }

    if (elBadgeRawatib) {
      elBadgeRawatib.textContent = `${stats.rawatibCount}/8`;
      elBadgeRawatib.classList.toggle('done', stats.rawatibCount === 8);
    }

    if (elBadgeSunnah) {
      elBadgeSunnah.textContent = `${stats.sunnahCount}/3`;
      elBadgeSunnah.classList.toggle('done', stats.sunnahCount === 3);
    }

    if (elBadgeLain) {
      elBadgeLain.textContent = `${stats.lainCount}/4`;
      elBadgeLain.classList.toggle('done', stats.lainCount === 4);
    }

    if (elBadgeQuran) {
      elBadgeQuran.textContent = `${stats.bacaQuranCount}/1`;
      elBadgeQuran.classList.toggle('done', stats.bacaQuranCount === 1);
    }

    if (elBadgeShaum) {
      elBadgeShaum.textContent = stats.shaumCount ? 'Puasa ✓' : '-';
      elBadgeShaum.classList.toggle('done', stats.shaumCount === 1);
    }

    if (elBadgeHafalan) {
      elBadgeHafalan.textContent = stats.hafalanCount ? '1/1' : '0/1';
      elBadgeHafalan.classList.toggle('done', stats.hafalanCount === 1);
    }

    // 2. Checklist Items
    // Wajib
    document.querySelectorAll('.check-item-card[data-cat="wajib"]').forEach(card => {
      const key = card.getAttribute('data-key');
      const item = data.wajib[key] || { done: false, jamaah: false };
      card.classList.toggle('checked', !!item.done);

      const jamaahBtn = card.querySelector('.btn-jamaah-toggle');
      if (jamaahBtn) {
        jamaahBtn.classList.toggle('active', !!item.jamaah);
      }
    });

    // Rawatib
    document.querySelectorAll('.check-item-card[data-cat="rawatib"]').forEach(card => {
      const key = card.getAttribute('data-key');
      card.classList.toggle('checked', !!(data.rawatib && data.rawatib[key]));
    });

    // Sunnah Lain
    document.querySelectorAll('.check-item-card[data-cat="sunnah"]').forEach(card => {
      const key = card.getAttribute('data-key');
      card.classList.toggle('checked', !!(data.sunnah && data.sunnah[key]));
    });

    // Lain
    document.querySelectorAll('.check-item-card[data-cat="lain"]').forEach(card => {
      const key = card.getAttribute('data-key');
      card.classList.toggle('checked', !!(data.lain && data.lain[key]));
    });

    // Quran check headers (Tadarus, Hafalan, Tadabbur)
    document.querySelectorAll('.quran-check-header').forEach(hdr => {
      const key = hdr.getAttribute('data-key');
      const isDone = !!(data.quran && data.quran[key]);
      const card = hdr.closest('.quran-module-item');
      if (card) {
        card.classList.toggle('checked', isDone);
      }
      const checkbox = hdr.querySelector('.custom-checkbox');
      if (checkbox) {
        checkbox.style.background = isDone ? 'var(--accent-gold)' : '';
        checkbox.style.borderColor = isDone ? 'var(--accent-gold)' : '';
        const svg = checkbox.querySelector('svg');
        if (svg) svg.style.strokeDashoffset = isDone ? '0' : '24';
      }
    });

    // Level 4 Shaum Rendering
    renderShaumSmartBanner(currentDate);

    const shaumToggleBox = document.getElementById('shaum-toggle-box');
    const shaumActiveBadge = document.getElementById('shaum-active-badge');
    const shaumStatusLabel = document.getElementById('shaum-status-label');
    const shaumCheckbox = document.getElementById('shaum-checkbox');

    if (shaumToggleBox) {
      shaumToggleBox.classList.toggle('checked', !!stats.shaumCount);
      if (shaumCheckbox) {
        const svg = shaumCheckbox.querySelector('svg');
        if (svg) svg.style.strokeDashoffset = stats.shaumCount ? '0' : '24';
      }
    }
    if (shaumActiveBadge) {
      shaumActiveBadge.textContent = stats.shaumCount ? '✓ Sedang Berpuasa' : 'Belum Puasa';
    }
    if (shaumStatusLabel) {
      shaumStatusLabel.textContent = stats.shaumCount 
        ? 'Alhamdulillah, Sedang / Telah Berpuasa Hari Ini' 
        : 'Sedang / Telah Berpuasa Hari Ini';
    }

    const curShaumType = data.shaum?.jenis || 'senin-kamis';
    document.querySelectorAll('.shaum-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-type') === curShaumType);
    });

    // Level 5 Hafalan Per Ayat Inputs & Rendering
    if (elHafalanStart) elHafalanStart.value = data.quran.hafalanAyatStart || '';
    if (elHafalanEnd) elHafalanEnd.value = data.quran.hafalanAyatEnd || '';
    if (elHafalanStatus) elHafalanStatus.value = data.quran.hafalanStatus || 'ziyadah';

    const hafalanTag = document.getElementById('hafalan-count-tag');
    if (hafalanTag) {
      const vLen = (data.quran.hafalanAyatList || []).length;
      hafalanTag.textContent = stats.hafalanCount 
        ? `${vLen > 0 ? vLen + ' Ayat' : 'Target'} Selesai ✓` 
        : `${vLen > 0 ? vLen + ' Ayat Dicentang' : 'Belum Selesai'}`;
    }

    renderHafalanVerseChips(data);

    // Quran inputs
    if (elTadarusSurah) elTadarusSurah.value = data.quran.tadarusSurah || '';
    if (elTadarusAin) elTadarusAin.value = data.quran.tadarusAin || '';
    if (elHafalanSurah) elHafalanSurah.value = data.quran.hafalanSurah || '';
    if (elHafalanAyat) elHafalanAyat.value = data.quran.hafalanAyat || '';
    if (elTadabburText) elTadabburText.value = data.quran.tadabburText || '';

    // Mood chips
    document.querySelectorAll('.mood-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-mood') === data.mood);
    });

    // Journal reflection textareas
    if (elNotes) elNotes.value = data.notes || '';
    if (elTargetBesok) elTargetBesok.value = data.targetBesok || '';
  }

  // --- Level Progression & Helper Functions ---
  function renderShaumSmartBanner(date) {
    const bannerTitle = document.getElementById('shaum-banner-title');
    const bannerSub = document.getElementById('shaum-banner-sub');
    const bannerBox = document.getElementById('shaum-smart-banner');
    if (!bannerTitle || !bannerSub) return;

    const day = date.getDay(); // 0 = Min, 1 = Sen, 4 = Kam
    const hijriStr = getHijriDate(date);
    const hijriDayMatch = hijriStr.match(/^\d+/);
    const hijriDay = hijriDayMatch ? parseInt(hijriDayMatch[0], 10) : 0;

    const isMonday = day === 1;
    const isThursday = day === 4;
    const isAyyamulBidh = (hijriDay === 13 || hijriDay === 14 || hijriDay === 15);

    if (isMonday || isThursday) {
      const dayName = isMonday ? 'Senin' : 'Kamis';
      bannerTitle.textContent = `⚡ Hari ini hari ${dayName} — Disunnahkan Berpuasa!`;
      bannerSub.textContent = `Rasulullah ﷺ bersabda: "Amal hamba diperiksa pada hari Senin & Kamis, maka aku suka jika amalku diperiksa saat berpuasa." (HR. Tirmidzi)`;
      bannerBox?.classList.add('active-recommendation');
    } else if (isAyyamulBidh) {
      bannerTitle.textContent = `🌕 Hari ini Yaumul Bidh (${hijriDay} Hijriah)!`;
      bannerSub.textContent = `Rasulullah ﷺ berpesan untuk shaum pada tanggal 13, 14, dan 15 setiap bulan Hijriah dengan pahala setara puasa setahun penuh (HR. Bukhari).`;
      bannerBox?.classList.add('active-recommendation');
    } else {
      bannerTitle.textContent = 'Jadwal Shaum Sunnah Utama';
      bannerSub.textContent = `Shaum Senin & Kamis serta Yaumul Bidh (13, 14, 15 tiap bulan Hijriah). Tanggal Hijriah hari ini: ${hijriStr}.`;
      bannerBox?.classList.remove('active-recommendation');
    }
  }

  function renderHafalanVerseChips(data) {
    const chipsContainer = document.getElementById('hafalan-verse-chips');
    if (!chipsContainer) return;

    let start = parseInt(data.quran.hafalanAyatStart, 10);
    let end = parseInt(data.quran.hafalanAyatEnd, 10);

    // If not set, parse from data.quran.hafalanAyat (e.g. "1-5" or "1")
    if (isNaN(start) || isNaN(end)) {
      const match = (data.quran.hafalanAyat || '').match(/(\d+)\s*[-–]\s*(\d+)/);
      if (match) {
        start = parseInt(match[1], 10);
        end = parseInt(match[2], 10);
      } else {
        const single = parseInt(data.quran.hafalanAyat, 10);
        if (!isNaN(single)) {
          start = single;
          end = single;
        }
      }
    }

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      chipsContainer.innerHTML = `
        <div class="empty-tracker-notice">
          Masukkan nomor ayat (contoh: 1 s/d 5) pada form di atas, lalu klik <strong>⚡ Buka Checklist Ayat</strong>.
        </div>
      `;
      return;
    }

    const maxEnd = Math.min(start + 50, end);
    chipsContainer.innerHTML = '';

    const list = Array.isArray(data.quran.hafalanAyatList) ? data.quran.hafalanAyatList : [];

    for (let v = start; v <= maxEnd; v++) {
      const isMem = list.includes(v);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `verse-chip ${isMem ? 'memorized' : ''}`;
      chip.setAttribute('data-verse', v);
      chip.innerHTML = `
        <span class="chip-check">${isMem ? '✓' : '○'}</span>
        <span>Ayat ${v}</span>
      `;

      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentData = getCurrentDayData();
        if (!Array.isArray(currentData.quran.hafalanAyatList)) {
          currentData.quran.hafalanAyatList = [];
        }

        const idx = currentData.quran.hafalanAyatList.indexOf(v);
        if (idx === -1) {
          currentData.quran.hafalanAyatList.push(v);
          playTone(660 + (v % 8) * 35, 'triangle', 0.08, 0.1);
        } else {
          currentData.quran.hafalanAyatList.splice(idx, 1);
          playTone(400, 'sine', 0.06, 0.06);
        }

        // Check if all verses in range are now memorized
        let allDone = true;
        for (let checkV = start; checkV <= maxEnd; checkV++) {
          if (!currentData.quran.hafalanAyatList.includes(checkV)) {
            allDone = false;
            break;
          }
        }
        if (allDone && maxEnd >= start) {
          currentData.quran.hafalanDone = true;
          triggerConfetti();
          playCompleteCelebrationSound();
        }

        saveDatabase();
        renderJournalForm();
      });

      chipsContainer.appendChild(chip);
    }
  }

  function syncHafalanRangeString(data) {
    if (data.quran.hafalanAyatStart && data.quran.hafalanAyatEnd) {
      data.quran.hafalanAyat = `${data.quran.hafalanAyatStart}-${data.quran.hafalanAyatEnd}`;
    } else if (data.quran.hafalanAyatStart) {
      data.quran.hafalanAyat = String(data.quran.hafalanAyatStart);
    }
  }

  function switchLevelStep(stepNum) {
    const target = Math.max(1, Math.min(6, parseInt(stepNum, 10)));
    const progression = getLevelProgressionStats();

    // Enforce step-by-step sequential unlock requirement:
    if (target === 2 && !progression.level2.isUnlocked) {
      openLockedModal(2);
      return;
    }
    if (target === 3 && !progression.level3.isUnlocked) {
      openLockedModal(3);
      return;
    }
    if (target === 4 && !progression.level4.isUnlocked) {
      openLockedModal(4);
      return;
    }
    if (target === 5 && !progression.level5.isUnlocked) {
      openLockedModal(5);
      return;
    }

    activeLevelStep = target;

    // Update active class on stepper buttons
    document.querySelectorAll('.level-step-card').forEach(btn => {
      const s = parseInt(btn.getAttribute('data-step'), 10);
      btn.classList.toggle('active', s === activeLevelStep);
      btn.setAttribute('aria-selected', s === activeLevelStep ? 'true' : 'false');
    });

    // Update panels visibility
    document.querySelectorAll('.level-panel').forEach(panel => {
      const l = parseInt(panel.getAttribute('data-level'), 10);
      panel.classList.toggle('active', l === activeLevelStep);
    });

    // Scroll smoothly to target panel
    const targetPanel = document.getElementById(`panel-level-${activeLevelStep}`);
    if (targetPanel) {
      targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    playTone(520, 'sine', 0.05, 0.06);
  }

  function toggleLevelViewMode() {
    isAllLevelsViewMode = !isAllLevelsViewMode;
    const container = document.getElementById('tab-journal');
    const modeIcon = document.getElementById('level-mode-icon');
    const modeText = document.getElementById('level-mode-text');

    if (container) {
      container.classList.toggle('show-all-levels', isAllLevelsViewMode);
    }

    if (modeText) {
      modeText.textContent = isAllLevelsViewMode ? 'Mode Semua Level' : 'Mode Bertahap';
    }
    if (modeIcon) {
      modeIcon.textContent = isAllLevelsViewMode ? '📜' : '📑';
    }

    showToast(isAllLevelsViewMode ? 'Menampilkan seluruh level sekaligus' : 'Kembali ke mode fokus bertahap');
    playTone(600, 'sine', 0.06, 0.06);
  }

  function renderStatsTab() {
    // 1. Weekly 7-Day Bar Chart
    const weeklyChartContainer = document.getElementById('weekly-chart-container');
    if (!weeklyChartContainer) return;
    weeklyChartContainer.innerHTML = '';

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    let totalSumPercent = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      const k = toDateKey(d);
      const dData = db[k];
      const stats = calculateDayStats(dData);
      totalSumPercent += stats.percentage;

      const isCurrentSelected = toDateKey(currentDate) === k;

      const barCol = document.createElement('div');
      barCol.className = `bar-col ${isCurrentSelected ? 'today' : ''}`;
      barCol.title = `${formatGregorianIndo(d)}: ${stats.percentage}%`;

      const barHeightPx = Math.max(6, Math.round((stats.percentage / 100) * 80));
      const isGold = stats.percentage >= 90;

      barCol.innerHTML = `
        <span class="bar-percent">${stats.percentage}%</span>
        <div class="bar-track">
          <div class="bar-fill ${isGold ? 'bar-gold' : ''}" style="height: ${barHeightPx}px;"></div>
        </div>
        <span class="bar-day-name">${dayNames[d.getDay()]}</span>
      `;

      barCol.addEventListener('click', () => {
        currentDate = new Date(d);
        renderAll();
      });

      weeklyChartContainer.appendChild(barCol);
    }

    const avg = Math.round(totalSumPercent / 7);
    const elAvgBadge = document.getElementById('stats-weekly-avg');
    if (elAvgBadge) elAvgBadge.textContent = `Rata-rata: ${avg}%`;

    // 2. Quran Accumulation Stats
    let totalAin = 0;
    let totalAyat = 0;
    let totalTadabbur = 0;
    let totalDaysLogged = 0;

    Object.keys(db).forEach(key => {
      const entry = db[key];
      if (!entry) return;
      const stats = calculateDayStats(entry);
      if (stats.totalCompleted > 0) totalDaysLogged++;

      if (entry.quran) {
        if (entry.quran.tadarusDone) {
          totalAin += 1; // 1 ain per target
        }
        if (entry.quran.hafalanDone) {
          totalAyat += 5; // 5 ayat per target
        }
        if (entry.quran.tadabburDone || (entry.quran.tadabburText && entry.quran.tadabburText.trim().length > 0)) {
          totalTadabbur += 1;
        }
      }
    });

    document.getElementById('total-ain-read').textContent = totalAin;
    document.getElementById('total-ayat-memorized').textContent = totalAyat;
    document.getElementById('total-tadabbur-notes').textContent = totalTadabbur;
    document.getElementById('total-days-logged').textContent = totalDaysLogged;

    // 3. 30-Day Activity Heatmap
    const heatmapGrid = document.getElementById('monthly-heatmap-grid');
    if (heatmapGrid) {
      heatmapGrid.innerHTML = '';
      for (let i = 29; i >= 0; i--) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - i);
        const k = toDateKey(d);
        const dData = db[k];
        const stats = calculateDayStats(dData);

        let lvl = 'level-0';
        if (stats.percentage >= 100) lvl = 'level-gold';
        else if (stats.percentage >= 75) lvl = 'level-4';
        else if (stats.percentage >= 50) lvl = 'level-3';
        else if (stats.percentage >= 25) lvl = 'level-2';
        else if (stats.percentage > 0) lvl = 'level-1';

        const cell = document.createElement('div');
        cell.className = `heatmap-cell ${lvl}`;
        cell.textContent = d.getDate();
        cell.title = `${formatGregorianIndo(d)}: ${stats.percentage}% terlaksana`;

        cell.addEventListener('click', () => {
          currentDate = new Date(d);
          renderAll();
          switchTab('tab-journal');
        });

        heatmapGrid.appendChild(cell);
      }
    }
  }

  function renderHistoryTab() {
    const container = document.getElementById('history-items-container');
    const searchVal = (document.getElementById('history-search-input').value || '').toLowerCase().trim();
    if (!container) return;
    container.innerHTML = '';

    const keys = Object.keys(db).sort().reverse();
    let countShown = 0;

    keys.forEach(k => {
      const entry = db[k];
      const stats = calculateDayStats(entry);
      if (stats.totalCompleted === 0 && !entry.notes && !entry.targetBesok) return;

      const dateObj = fromDateKey(k);
      const formattedDate = formatGregorianIndo(dateObj);

      // Search matching
      const surahRead = (entry.quran?.tadarusSurah || '').toLowerCase();
      const surahHafal = (entry.quran?.hafalanSurah || '').toLowerCase();
      const notes = (entry.notes || '').toLowerCase();
      const tadabbur = (entry.quran?.tadabburText || '').toLowerCase();

      if (searchVal && !formattedDate.toLowerCase().includes(searchVal) &&
          !surahRead.includes(searchVal) && !surahHafal.includes(searchVal) &&
          !notes.includes(searchVal) && !tadabbur.includes(searchVal)) {
        return;
      }

      countShown++;

      const itemCard = document.createElement('div');
      itemCard.className = 'history-item-card';

      let badgeColor = 'rgba(16, 185, 129, 0.15)';
      let badgeTextColor = 'var(--accent-emerald-light)';
      if (stats.percentage >= 90) {
        badgeColor = 'rgba(245, 158, 11, 0.2)';
        badgeTextColor = 'var(--accent-gold-light)';
      }

      itemCard.innerHTML = `
        <div class="history-item-top">
          <span class="history-item-date">${formattedDate}</span>
          <span class="history-item-badge" style="background:${badgeColor}; color:${badgeTextColor};">
            ${stats.percentage}% Capaian
          </span>
        </div>
        <div class="history-snippets">
          <span class="history-pill green">🕌 Wajib: ${stats.wajibCount}/5</span>
          <span class="history-pill gold">⭐ Rawatib: ${stats.rawatibCount}/8</span>
          <span class="history-pill">✨ Sunnah: ${stats.sunnahCount}/3</span>
          ${entry.quran?.tadarusDone ? `<span class="history-pill gold">📖 1 'Ain ${entry.quran.tadarusSurah || ''}</span>` : ''}
          ${entry.quran?.hafalanDone ? `<span class="history-pill gold">🧠 5 Ayat ${entry.quran.hafalanSurah || ''}</span>` : ''}
          ${entry.mood ? `<span class="history-pill">Hati: ${entry.mood}</span>` : ''}
        </div>
        ${entry.notes ? `<p class="history-note-preview">"${escapeHTML(entry.notes)}"</p>` : ''}
      `;

      itemCard.addEventListener('click', () => {
        currentDate = dateObj;
        renderAll();
        switchTab('tab-journal');
      });

      container.appendChild(itemCard);
    });

    if (countShown === 0) {
      container.innerHTML = `
        <div class="empty-history-state">
          <span>📖</span>
          <p>Belum ada catatan yang sesuai.</p>
        </div>
      `;
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function showToast(msg) {
    if (!elToast) return;
    elToast.innerHTML = `<span>✓ ${msg}</span>`;
    elToast.classList.add('show');
    setTimeout(() => {
      elToast.classList.remove('show');
    }, 2200);
  }

  function setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const iconShow = btn.querySelector('.icon-eye-show');
      const iconHide = btn.querySelector('.icon-eye-hide');

      if (isPassword) {
        iconShow?.classList.add('hidden');
        iconHide?.classList.remove('hidden');
      } else {
        iconShow?.classList.remove('hidden');
        iconHide?.classList.add('hidden');
      }
    });
  }

  // ==========================================================================
  // MODUL AL-QUR'AN & TERJEMAHAN PER AYAT
  // ==========================================================================
  let currentSurahNumber = 1;
  let currentSurahDetail = null;
  let quranSearchQuery = '';
  let quranActiveFilter = 'all';
  let quranFontSize = 1.7; // in rem
  let quranShowLatin = true;
  let quranShowArti = true;
  let activeAudioObj = null;
  let isPlayingFullSurah = false;
  let currentlyPlayingVerse = null;

  const POPULAR_SURAH_NUMBERS = [1, 18, 36, 55, 56, 67, 78, 93, 94, 112, 113, 114];

  function renderQuranCatalog() {
    const container = document.getElementById('surah-cards-list');
    if (!container || typeof ALL_SURAHS === 'undefined') return;

    container.innerHTML = '';
    const query = quranSearchQuery.toLowerCase().trim();

    const filtered = ALL_SURAHS.filter(surah => {
      if (quranActiveFilter === 'pilihan' && !POPULAR_SURAH_NUMBERS.includes(surah.nomor)) {
        return false;
      }
      if (quranActiveFilter === 'juz30' && surah.nomor < 78) {
        return false;
      }
      if (quranActiveFilter === 'makkiyyah' && surah.tempatTurun !== 'Mekah') {
        return false;
      }
      if (quranActiveFilter === 'madaniyyah' && surah.tempatTurun !== 'Madinah') {
        return false;
      }

      if (query) {
        const matchName = surah.namaLatin.toLowerCase().includes(query);
        const matchNum = String(surah.nomor) === query;
        const matchArti = surah.arti.toLowerCase().includes(query);
        return matchName || matchNum || matchArti;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-history-state" style="grid-column: span 2;">
          <span>🔍</span>
          <p>Surat tidak ditemukan. Coba kata kunci lain.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(surah => {
      const card = document.createElement('div');
      card.className = 'surah-card-item';
      card.innerHTML = `
        <div class="surah-card-left">
          <div class="surah-num-badge">${surah.nomor}</div>
          <div class="surah-card-texts">
            <span class="surah-card-latin">${surah.namaLatin}</span>
            <span class="surah-card-sub">${surah.arti} &bull; ${surah.jumlahAyat} Ayat</span>
          </div>
        </div>
        <div class="surah-card-arabic">${surah.nama}</div>
      `;

      card.addEventListener('click', () => {
        playTone(520, 'sine', 0.08, 0.08);
        openSurahReader(surah.nomor);
      });

      container.appendChild(card);
    });
  }

  async function openSurahReader(nomor) {
    stopCurrentAudio();
    currentSurahNumber = parseInt(nomor, 10);

    const catalogView = document.getElementById('quran-catalog-view');
    const readerView = document.getElementById('quran-reader-view');
    const versesContainer = document.getElementById('surah-verses-container');

    if (catalogView) catalogView.classList.add('hidden');
    if (readerView) readerView.classList.remove('hidden');

    if (versesContainer) {
      versesContainer.innerHTML = `
        <div class="loading-surah-box">
          <div class="loading-spinner"></div>
          <p>Memuat surat & terjemahan per ayat...</p>
        </div>
      `;
    }

    readerView?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const surah = await fetchSurahDetail(currentSurahNumber);
      currentSurahDetail = surah;
      renderSurahReaderContent(surah);
    } catch (err) {
      if (versesContainer) {
        versesContainer.innerHTML = `
          <div class="empty-history-state">
            <span>⚠️</span>
            <p>Gagal memuat surat dari server (Koneksi internet terputus).</p>
            <p style="font-size:0.75rem;">Kamu tetap bisa membaca surat offline preset seperti Al-Fatihah, An-Naba, Al-Mulk, Al-Ikhlas, Al-Falaq, An-Nas.</p>
            <button class="btn-secondary" id="btn-retry-surah" style="margin-top:10px;">Coba Lagi</button>
          </div>
        `;
        document.getElementById('btn-retry-surah')?.addEventListener('click', () => openSurahReader(nomor));
      }
    }
  }

  function renderSurahReaderContent(surah) {
    document.getElementById('reader-surah-num').textContent = `Surah ke-${surah.nomor}`;
    document.getElementById('reader-surah-latin').textContent = surah.namaLatin;
    document.getElementById('reader-surah-desc').textContent = `${surah.arti} • ${surah.jumlahAyat} Ayat • ${surah.tempatTurun}`;
    document.getElementById('reader-surah-arabic').textContent = surah.nama;

    const bismillahBanner = document.getElementById('reader-bismillah-banner');
    if (bismillahBanner) {
      bismillahBanner.classList.toggle('hidden', surah.nomor === 1 || surah.nomor === 9);
    }

    updateAudioStatusUI(false);

    const container = document.getElementById('surah-verses-container');
    if (!container) return;
    container.innerHTML = '';

    surah.ayat.forEach(ay => {
      const card = document.createElement('div');
      card.className = 'verse-card';
      card.id = `verse-card-${ay.nomorAyat}`;

      card.innerHTML = `
        <div class="verse-top-bar">
          <div class="verse-number-badge">Ayat ${ay.nomorAyat}</div>
          <div class="verse-actions">
            ${ay.audio ? `
            <button type="button" class="verse-action-btn btn-play-verse" title="Putar Murottal Ayat Ini" data-ayat="${ay.nomorAyat}">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>` : ''}
            <button type="button" class="verse-action-btn btn-action-hafalan" title="Jadikan target hafalan di jurnal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon></svg>
              <span>Hafalan</span>
            </button>
            <button type="button" class="verse-action-btn btn-action-tadabbur" title="Catat arti ayat ini ke jurnal tadabbur">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              <span>Tadabbur</span>
            </button>
            <button type="button" class="verse-action-btn btn-action-copy" title="Salin ayat & artinya">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
        </div>
        <div class="verse-arabic" style="font-size: ${quranFontSize}rem;">${ay.teksArab}</div>
        <div class="verse-latin ${quranShowLatin ? '' : 'hidden'}">${ay.teksLatin}</div>
        <div class="verse-translation ${quranShowArti ? '' : 'hidden'}">${ay.teksIndonesia}</div>
      `;

      // Event: Play Verse Audio
      const playBtn = card.querySelector('.btn-play-verse');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          togglePlayVerseAudio(ay.audio, ay.nomorAyat);
        });
      }

      // Event: Set Hafalan
      const hafalanBtn = card.querySelector('.btn-action-hafalan');
      if (hafalanBtn) {
        hafalanBtn.addEventListener('click', () => {
          const data = getCurrentDayData();
          data.quran.hafalanSurah = surah.namaLatin;
          data.quran.hafalanAyat = String(ay.nomorAyat);
          data.quran.hafalanDone = true;
          saveDatabase();
          playCheckSound();
          renderJournalForm();
          showToast(`Target hafalan diset: ${surah.namaLatin} ayat ${ay.nomorAyat}`);
        });
      }

      // Event: Catat ke Tadabbur
      const tadabburBtn = card.querySelector('.btn-action-tadabbur');
      if (tadabburBtn) {
        tadabburBtn.addEventListener('click', () => {
          const data = getCurrentDayData();
          const insight = `[QS. ${surah.namaLatin}: ${ay.nomorAyat}] "${ay.teksIndonesia}"`;
          if (data.quran.tadabburText) {
            data.quran.tadabburText += `\n${insight}`;
          } else {
            data.quran.tadabburText = insight;
          }
          data.quran.tadabburDone = true;
          saveDatabase();
          playCheckSound();
          renderJournalForm();
          showToast(`Arti QS. ${surah.namaLatin}:${ay.nomorAyat} disematkan ke Tadabbur!`);
        });
      }

      // Event: Salin Ayat
      const copyBtn = card.querySelector('.btn-action-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const textToCopy = `QS. ${surah.namaLatin} ayat ${ay.nomorAyat}:\n${ay.teksArab}\n\n${ay.teksLatin}\n\nArtinya:\n"${ay.teksIndonesia}"`;
          navigator.clipboard?.writeText(textToCopy);
          playTone(600, 'sine', 0.08, 0.08);
          showToast(`Ayat ${ay.nomorAyat} disalin ke clipboard!`);
        });
      }

      container.appendChild(card);
    });
  }

  function stopCurrentAudio() {
    if (activeAudioObj) {
      activeAudioObj.pause();
      activeAudioObj = null;
    }
    isPlayingFullSurah = false;
    currentlyPlayingVerse = null;
    updateAudioStatusUI(false);
    document.querySelectorAll('.verse-card.playing').forEach(c => c.classList.remove('playing'));
    document.querySelectorAll('.btn-play-verse.playing').forEach(b => b.classList.remove('playing'));
  }

  function togglePlayFullSurah() {
    if (!currentSurahDetail || !currentSurahDetail.audioFull) {
      alert("Audio full surah tidak tersedia.");
      return;
    }

    if (isPlayingFullSurah) {
      stopCurrentAudio();
    } else {
      stopCurrentAudio();
      isPlayingFullSurah = true;
      updateAudioStatusUI(true, "Memutar Full Surah...");

      activeAudioObj = new Audio(currentSurahDetail.audioFull);
      activeAudioObj.play().catch(e => {
        console.warn("Audio play blocked", e);
        stopCurrentAudio();
      });

      activeAudioObj.onended = () => {
        stopCurrentAudio();
      };
      activeAudioObj.onerror = () => {
        stopCurrentAudio();
        showToast("Gagal memuat audio murottal");
      };
    }
  }

  function togglePlayVerseAudio(url, nomorAyat) {
    if (currentlyPlayingVerse === nomorAyat) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    currentlyPlayingVerse = nomorAyat;

    const card = document.getElementById(`verse-card-${nomorAyat}`);
    if (card) {
      card.classList.add('playing');
      const btn = card.querySelector('.btn-play-verse');
      if (btn) btn.classList.add('playing');
    }

    activeAudioObj = new Audio(url);
    activeAudioObj.play().catch(e => {
      console.warn("Audio play blocked", e);
      stopCurrentAudio();
    });

    activeAudioObj.onended = () => {
      stopCurrentAudio();
    };
    activeAudioObj.onerror = () => {
      stopCurrentAudio();
      showToast("Gagal memuat audio ayat");
    };
  }

  function updateAudioStatusUI(isPlaying, text = "Audio Siap") {
    const iconPlay = document.getElementById('icon-audio-play');
    const iconPause = document.getElementById('icon-audio-pause');
    const statusPill = document.getElementById('audio-status-pill');

    if (iconPlay && iconPause) {
      if (isPlaying) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
      } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
      }
    }

    if (statusPill) {
      statusPill.textContent = isPlaying ? text : "Audio Siap";
      statusPill.classList.toggle('playing', isPlaying);
    }
  }

  // --- Tab Switching ---
  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
    if (tabId === 'tab-quran') {
      renderQuranCatalog();
    } else if (tabId === 'tab-stats') {
      renderStatsTab();
    } else if (tabId === 'tab-history') {
      renderHistoryTab();
    }
  }

  // --- Event Listeners & Binding ---
  function initEvents() {
    // Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        playTone(440, 'sine', 0.05, 0.05);
        switchTab(tab.getAttribute('data-tab'));
      });
    });

    // Date Navigation
    document.getElementById('btn-prev-day').addEventListener('click', () => {
      playTone(400, 'sine', 0.06, 0.06);
      currentDate.setDate(currentDate.getDate() - 1);
      renderAll();
    });

    document.getElementById('btn-next-day').addEventListener('click', () => {
      playTone(500, 'sine', 0.06, 0.06);
      currentDate.setDate(currentDate.getDate() + 1);
      renderAll();
    });

    document.getElementById('btn-go-today').addEventListener('click', () => {
      playTone(520, 'sine', 0.08, 0.08);
      currentDate = new Date();
      renderAll();
    });

    // Date Picker Trigger
    document.getElementById('date-display-trigger').addEventListener('click', () => {
      if (elNativeDate.showPicker) {
        elNativeDate.showPicker();
      } else {
        elNativeDate.focus();
      }
    });

    elNativeDate.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = fromDateKey(e.target.value);
        renderAll();
      }
    });

    // Sound Toggle
    const btnSound = document.getElementById('btn-sound-toggle');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    function updateSoundUI() {
      if (soundEnabled) {
        iconSoundOn.classList.remove('hidden');
        iconSoundOff.classList.add('hidden');
      } else {
        iconSoundOn.classList.add('hidden');
        iconSoundOff.classList.remove('hidden');
      }
    }
    updateSoundUI();

    btnSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_KEY, soundEnabled);
      updateSoundUI();
      if (soundEnabled) playTone(660, 'sine', 0.1, 0.15);
    });

    // Theme Toggle (Dark & Light)
    const btnTheme = document.getElementById('btn-theme-toggle');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');

    let currentTheme = localStorage.getItem(THEME_KEY) || 'theme-dark';
    document.body.className = currentTheme;

    function updateThemeUI() {
      if (currentTheme === 'theme-light') {
        iconSun.classList.remove('hidden');
        iconMoon.classList.add('hidden');
      } else {
        iconSun.classList.add('hidden');
        iconMoon.classList.remove('hidden');
      }
    }
    updateThemeUI();

    btnTheme.addEventListener('click', () => {
      currentTheme = currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
      document.body.className = currentTheme;
      localStorage.setItem(THEME_KEY, currentTheme);
      updateThemeUI();
      playTone(550, 'sine', 0.08, 0.08);
    });

    // Checklist Card Clicks (Wajib, Sunnah, Lain)
    document.querySelectorAll('.check-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If clicking the jamaah button specifically, don't trigger main check
        if (e.target.closest('.btn-jamaah-toggle')) return;

        const cat = card.getAttribute('data-cat');
        const key = card.getAttribute('data-key');
        const data = getCurrentDayData();

        if (cat === 'wajib') {
          data.wajib[key].done = !data.wajib[key].done;
        } else if (cat === 'rawatib') {
          if (!data.rawatib) data.rawatib = {};
          data.rawatib[key] = !data.rawatib[key];
        } else if (cat === 'sunnah') {
          if (!data.sunnah) data.sunnah = {};
          data.sunnah[key] = !data.sunnah[key];
        } else if (cat === 'lain') {
          if (!data.lain) data.lain = {};
          data.lain[key] = !data.lain[key];
        }

        saveDatabase();
        playCheckSound();
        renderJournalForm();
      });
    });

    // Jamaah Pill Toggles
    document.querySelectorAll('.btn-jamaah-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.check-item-card');
        const key = card.getAttribute('data-key');
        const data = getCurrentDayData();

        data.wajib[key].jamaah = !data.wajib[key].jamaah;
        if (data.wajib[key].jamaah) {
          // Auto check if marked as jamaah
          data.wajib[key].done = true;
        }

        saveDatabase();
        playTone(740, 'triangle', 0.09, 0.1);
        renderJournalForm();
      });
    });

    // Quran Check Headers
    document.querySelectorAll('.quran-check-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const key = hdr.getAttribute('data-key');
        const data = getCurrentDayData();
        data.quran[key] = !data.quran[key];

        saveDatabase();
        playCheckSound();
        renderJournalForm();
      });
    });

    // Quran Inputs Live Sync
    elTadarusSurah.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.quran.tadarusSurah = elTadarusSurah.value;
      if (elTadarusSurah.value.trim().length > 0) data.quran.tadarusDone = true;
      saveDatabase();
      renderJournalForm();
    });

    elTadarusAin.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.quran.tadarusAin = elTadarusAin.value;
      if (elTadarusAin.value) data.quran.tadarusDone = true;
      saveDatabase();
      renderJournalForm();
    });

    elHafalanSurah.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.quran.hafalanSurah = elHafalanSurah.value;
      if (elHafalanSurah.value.trim().length > 0) data.quran.hafalanDone = true;
      saveDatabase();
      renderJournalForm();
    });

    elHafalanAyat.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.quran.hafalanAyat = elHafalanAyat.value;
      if (elHafalanAyat.value.trim().length > 0) data.quran.hafalanDone = true;
      saveDatabase();
      renderJournalForm();
    });

    elTadabburText.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.quran.tadabburText = elTadabburText.value;
      if (elTadabburText.value.trim().length > 5) data.quran.tadabburDone = true;
      saveDatabase();
      renderJournalForm();
    });

    // Mood Chips
    document.querySelectorAll('.mood-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const mood = chip.getAttribute('data-mood');
        const data = getCurrentDayData();
        data.mood = data.mood === mood ? '' : mood;
        saveDatabase();
        playTone(600, 'sine', 0.08, 0.08);
        renderJournalForm();
      });
    });

    // Journal Reflections
    elNotes.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.notes = elNotes.value;
      saveDatabase();
    });

    elTargetBesok.addEventListener('input', () => {
      const data = getCurrentDayData();
      data.targetBesok = elTargetBesok.value;
      saveDatabase();
    });

    // Level Stepper Navigation
    document.querySelectorAll('.level-step-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.getAttribute('data-step');
        switchLevelStep(step);
      });
    });

    document.querySelectorAll('.level-stat-card[data-jump-level]').forEach(card => {
      card.addEventListener('click', () => {
        const lvl = card.getAttribute('data-jump-level');
        switchLevelStep(lvl);
      });
    });

    const btnToggleLevelView = document.getElementById('btn-toggle-level-view');
    if (btnToggleLevelView) {
      btnToggleLevelView.addEventListener('click', () => {
        toggleLevelViewMode();
      });
    }

    // Step Nav Next & Prev Buttons
    document.querySelectorAll('.btn-level-next[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = btn.getAttribute('data-goto');
        switchLevelStep(targetStep);
      });
    });

    document.querySelectorAll('.btn-level-prev[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = btn.getAttribute('data-goto');
        switchLevelStep(targetStep);
      });
    });

    const btnFinishFlow = document.getElementById('btn-finish-journal-flow');
    if (btnFinishFlow) {
      btnFinishFlow.addEventListener('click', () => {
        saveDatabase();
        playCheckSound();
        triggerConfetti();
        showToast('MasyaAllah, seluruh catatan ibadah tersimpan!');
      });
    }

    // Multi-Level Step-by-Step Simulation & Lock Modal Events
    // Level 1 -> 2
    document.getElementById('btn-sim-unlock-10d')?.addEventListener('click', () => {
      simulateUnlockLevel(2, true);
    });
    document.getElementById('btn-sim-reset-10d')?.addEventListener('click', () => {
      simulateUnlockLevel(2, false);
    });

    // Level 2 -> 3
    document.getElementById('btn-sim-unlock-l3')?.addEventListener('click', () => {
      simulateUnlockLevel(3, true);
    });
    document.getElementById('btn-sim-reset-l3')?.addEventListener('click', () => {
      simulateUnlockLevel(3, false);
    });

    // Level 3 -> 4
    document.getElementById('btn-sim-unlock-l4')?.addEventListener('click', () => {
      simulateUnlockLevel(4, true);
    });
    document.getElementById('btn-sim-reset-l4')?.addEventListener('click', () => {
      simulateUnlockLevel(4, false);
    });

    // Level 4 -> 5
    document.getElementById('btn-sim-unlock-l5')?.addEventListener('click', () => {
      simulateUnlockLevel(5, true);
    });
    document.getElementById('btn-sim-reset-l5')?.addEventListener('click', () => {
      simulateUnlockLevel(5, false);
    });

    // Simulation triggers in panel locked banners (.btn-sim-unlock-level)
    document.querySelectorAll('.btn-sim-unlock-level').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.getAttribute('data-unlock-level'), 10) || 2;
        simulateUnlockLevel(lvl, true);
      });
    });

    // Jump buttons in panel locked banners (.btn-jump-to-level)
    document.querySelectorAll('.btn-jump-to-level').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-goto');
        if (target) switchLevelStep(target);
      });
    });

    // Modal Events
    document.getElementById('btn-sim-unlock-from-modal')?.addEventListener('click', () => {
      document.getElementById('modal-level-locked')?.classList.add('hidden');
      simulateUnlockLevel(pendingLockedLevel, true);
      switchLevelStep(pendingLockedLevel);
    });

    document.getElementById('btn-close-modal-locked')?.addEventListener('click', () => {
      document.getElementById('modal-level-locked')?.classList.add('hidden');
    });

    document.getElementById('btn-locked-back-to-level1')?.addEventListener('click', () => {
      document.getElementById('modal-level-locked')?.classList.add('hidden');
      switchLevelStep(Math.max(1, pendingLockedLevel - 1));
    });

    document.querySelectorAll('.btn-jump-to-level1').forEach(btn => {
      btn.addEventListener('click', () => {
        switchLevelStep(1);
      });
    });

    // Level 4: Shaum Sunnah Events
    const shaumToggleBox = document.getElementById('shaum-toggle-box');
    if (shaumToggleBox) {
      shaumToggleBox.addEventListener('click', () => {
        const data = getCurrentDayData();
        if (!data.shaum) data.shaum = { puasaHariIni: false, jenis: 'senin-kamis', catatan: '' };
        data.shaum.puasaHariIni = !data.shaum.puasaHariIni;
        saveDatabase();
        if (data.shaum.puasaHariIni) {
          playCheckSound();
          showToast('Shaum sunnah dicatat! Semoga Allah menerima puasamu.');
        } else {
          playTone(450, 'sine', 0.08, 0.08);
          showToast('Status shaum: Istirahat / Tidak Berpuasa');
        }
        renderJournalForm();
      });
    }

    document.querySelectorAll('.shaum-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = chip.getAttribute('data-type');
        const data = getCurrentDayData();
        if (!data.shaum) data.shaum = { puasaHariIni: false, jenis: 'senin-kamis', catatan: '' };
        data.shaum.jenis = type;
        data.shaum.puasaHariIni = true;
        saveDatabase();
        playCheckSound();
        renderJournalForm();
        showToast(`Kategori shaum: ${chip.textContent.trim()}`);
      });
    });

    const shaumDoaToggle = document.getElementById('shaum-doa-toggle');
    const shaumDoaContent = document.getElementById('shaum-doa-content');
    const shaumDoaArrow = document.getElementById('shaum-doa-arrow');
    if (shaumDoaToggle && shaumDoaContent) {
      shaumDoaToggle.addEventListener('click', () => {
        const isHidden = shaumDoaContent.classList.toggle('hidden');
        if (shaumDoaArrow) shaumDoaArrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        playTone(550, 'sine', 0.05, 0.05);
      });
    }

    // Level 5: Hafalan Quran Per Ayat Events
    if (elHafalanStart) {
      elHafalanStart.addEventListener('input', () => {
        const data = getCurrentDayData();
        data.quran.hafalanAyatStart = elHafalanStart.value;
        syncHafalanRangeString(data);
        saveDatabase();
      });
    }

    if (elHafalanEnd) {
      elHafalanEnd.addEventListener('input', () => {
        const data = getCurrentDayData();
        data.quran.hafalanAyatEnd = elHafalanEnd.value;
        syncHafalanRangeString(data);
        saveDatabase();
      });
    }

    if (elHafalanStatus) {
      elHafalanStatus.addEventListener('change', () => {
        const data = getCurrentDayData();
        data.quran.hafalanStatus = elHafalanStatus.value;
        saveDatabase();
        renderJournalForm();
      });
    }

    const btnBuildVerses = document.getElementById('btn-build-verse-tracker');
    if (btnBuildVerses) {
      btnBuildVerses.addEventListener('click', () => {
        const data = getCurrentDayData();
        const start = parseInt(elHafalanStart?.value, 10) || 1;
        const end = parseInt(elHafalanEnd?.value, 10) || (start + 4);
        data.quran.hafalanAyatStart = String(start);
        data.quran.hafalanAyatEnd = String(end);
        syncHafalanRangeString(data);
        saveDatabase();
        playTone(680, 'triangle', 0.1, 0.12);
        renderHafalanVerseChips(data);
        showToast(`Checklist ayat ${start} s/d ${end} siap digunakan!`);
      });
    }

    // Direct Jump to Quran Tab buttons
    const btnJumpQuran = document.getElementById('btn-jump-to-quran-tab');
    if (btnJumpQuran) {
      btnJumpQuran.addEventListener('click', () => {
        switchTab('tab-quran');
        playTone(600, 'sine', 0.08, 0.08);
      });
    }

    const btnListenHafalan = document.getElementById('btn-listen-hafalan-surah');
    if (btnListenHafalan) {
      btnListenHafalan.addEventListener('click', () => {
        const surahName = (elHafalanSurah.value || '').trim();
        if (surahName && typeof ALL_SURAHS !== 'undefined') {
          const matched = ALL_SURAHS.find(s => 
            s.namaLatin.toLowerCase().includes(surahName.toLowerCase()) || 
            surahName.toLowerCase().includes(s.namaLatin.toLowerCase())
          );
          if (matched) {
            switchTab('tab-quran');
            openSurahReader(matched.nomor);
            return;
          }
        }
        switchTab('tab-quran');
      });
    }

    // "Simpan Jurnal" Primary Button
    document.getElementById('btn-save-journal').addEventListener('click', () => {
      const data = getCurrentDayData();
      data.updatedAt = Date.now();
      saveDatabase();
      playTone(800, 'sine', 0.15, 0.18);
      showToast('Jurnal Ibadah Berhasil Disimpan!');
      renderAll();
    });

    // "Bagikan ke WhatsApp" Button
    document.getElementById('btn-share-wa').addEventListener('click', () => {
      shareToWhatsApp();
    });

    // History Search Filter
    document.getElementById('history-search-input').addEventListener('input', () => {
      renderHistoryTab();
    });

    // Modals
    const modalSettings = document.getElementById('modal-settings');
    const modalUserManager = document.getElementById('modal-user-manager');

    // Open User Management Modal
    const openUserModal = async () => {
      renderUsersUI();
      modalUserManager?.classList.remove('hidden');
      await checkBackendStatus();
      await syncUsersFromBackend();
      renderUsersUI();
    };

    document.getElementById('btn-open-user-modal')?.addEventListener('click', openUserModal);
    document.getElementById('user-profile-badge')?.addEventListener('click', openUserModal);
    document.getElementById('btn-settings-manage-users')?.addEventListener('click', () => {
      modalSettings?.classList.add('hidden');
      openUserModal();
    });

    // AMWA Brand Logo - Discreet Super User / Admin Trigger
    const brandLogoAmwa = document.getElementById('brand-logo-amwa');
    const modalAdminAuth = document.getElementById('modal-admin-auth');
    const modalAdminPanel = document.getElementById('modal-admin-panel');

    const triggerAdminAccess = () => {
      playTone(550, 'sine', 0.08, 0.1);
      if (isAdminSessionActive) {
        openAdminPanel();
      } else {
        const inputAdminPw = document.getElementById('input-admin-password');
        const adminAuthErr = document.getElementById('admin-auth-error');
        if (inputAdminPw) inputAdminPw.value = '';
        adminAuthErr?.classList.add('hidden');
        modalAdminAuth?.classList.remove('hidden');
        setTimeout(() => inputAdminPw?.focus(), 150);
      }
    };

    brandLogoAmwa?.addEventListener('click', triggerAdminAccess);
    brandLogoAmwa?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerAdminAccess();
      }
    });

    // Database Status Indicator Click (Admin Panel)
    document.getElementById('admin-db-status-pill')?.addEventListener('click', async () => {
      const active = await checkBackendStatus();
      if (active) {
        await syncUsersFromBackend();
        renderUsersUI();
        showToast(backendType === 'gsheet' ? 'Google Spreadsheet terhubung!' : 'Database MySQL terhubung!');
      } else {
        showToast(getGSheetUrl() ? 'Gagal terhubung ke Google Sheet' : 'Mode lokal aktif. Silakan hubungkan Google Spreadsheet.');
      }
    });

    // Form Super User Authentication
    document.getElementById('form-admin-auth')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputPw = document.getElementById('input-admin-password');
      const entered = (inputPw ? inputPw.value : '').trim();
      const errEl = document.getElementById('admin-auth-error');

      const users = getUsersDatabase();
      const superUser = users.find(u => u.role === 'super_admin') || users[0];
      const enteredHash = await hashPassword(entered);

      const isValidPin = entered === 'admin123' || entered === 'amwa2026';
      const isValidSuperPw = superUser && superUser.passwordHash && superUser.passwordHash === enteredHash;

      if (isValidPin || isValidSuperPw) {
        isAdminSessionActive = true;
        modalAdminAuth?.classList.add('hidden');
        showToast('Hak akses Super User aktif!');
        playTone(660, 'sine', 0.12, 0.15);
        setTimeout(() => playTone(880, 'sine', 0.15, 0.12), 90);
        openAdminPanel();
      } else {
        if (errEl) {
          errEl.classList.remove('hidden');
          errEl.textContent = '❌ Password / PIN Super User salah.';
        }
        playTone(250, 'sawtooth', 0.15, 0.2);
      }
    });

    document.getElementById('btn-close-admin-auth')?.addEventListener('click', () => {
      modalAdminAuth?.classList.add('hidden');
    });

    document.getElementById('btn-cancel-admin-auth')?.addEventListener('click', () => {
      modalAdminAuth?.classList.add('hidden');
    });

    modalAdminAuth?.addEventListener('click', (e) => {
      if (e.target === modalAdminAuth) modalAdminAuth.classList.add('hidden');
    });

    // Super User Admin Panel Handlers
    document.getElementById('btn-close-admin-panel')?.addEventListener('click', () => {
      modalAdminPanel?.classList.add('hidden');
    });

    modalAdminPanel?.addEventListener('click', (e) => {
      if (e.target === modalAdminPanel) modalAdminPanel.classList.add('hidden');
    });

    // Lock Admin Panel
    document.getElementById('btn-lock-admin-panel')?.addEventListener('click', () => {
      isAdminSessionActive = false;
      modalAdminPanel?.classList.add('hidden');
      renderUsersUI();
      showToast('Akses Super User telah dikunci.');
      playTone(400, 'sine', 0.1, 0.1);
    });

    setupPasswordToggle('btn-toggle-admin-pw', 'input-admin-password');

    // Save & Connect Google Spreadsheet URL (Only Super User)
    document.getElementById('btn-save-gsheet-url')?.addEventListener('click', async () => {
      if (!isSuperUser()) {
        showToast('Hanya Super User (Admin) yang dapat mengubah URL database.');
        return;
      }
      const inputGSheet = document.getElementById('input-gsheet-url');
      const urlVal = inputGSheet ? inputGSheet.value.trim() : '';
      setGSheetUrl(urlVal);
      showToast('Menguji koneksi ke Google Spreadsheet...');
      const ok = await checkBackendStatus();
      if (ok && backendType === 'gsheet') {
        showToast('Google Spreadsheet berhasil terhubung!');
        await syncUsersFromBackend();
        const activeId = getActiveUserId();
        if (activeId) await loadUserJournalFromBackend(activeId);
        renderAll();
      } else if (!urlVal) {
        showToast('URL dihapus. Menggunakan penyimpanan lokal.');
        renderUsersUI();
      } else {
        showToast('Gagal terhubung. Pastikan Web App diset "Who has access: Anyone".');
      }
    });

    // Google Spreadsheet Guide Modal
    const modalGSheetGuide = document.getElementById('modal-gsheet-guide');
    document.getElementById('btn-open-gsheet-guide')?.addEventListener('click', () => {
      modalGSheetGuide?.classList.remove('hidden');
    });

    document.getElementById('btn-close-gsheet-guide')?.addEventListener('click', () => {
      modalGSheetGuide?.classList.add('hidden');
    });

    modalGSheetGuide?.addEventListener('click', (e) => {
      if (e.target === modalGSheetGuide) modalGSheetGuide.classList.add('hidden');
    });

    // Copy Google Apps Script Code
    document.getElementById('btn-copy-apps-script')?.addEventListener('click', async () => {
      try {
        const res = await fetch('google-apps-script.js');
        if (res.ok) {
          const txt = await res.text();
          await navigator.clipboard.writeText(txt);
          showToast('Kode Google Apps Script disalin ke clipboard!');
          return;
        }
      } catch (err) {}
      showToast('Buka file google-apps-script.js di folder aplikasi untuk menyalin kodenya.');
    });

    document.getElementById('btn-close-user-modal')?.addEventListener('click', () => {
      modalUserManager?.classList.add('hidden');
    });

    modalUserManager?.addEventListener('click', (e) => {
      if (e.target === modalUserManager) modalUserManager.classList.add('hidden');
    });

    // Form Tambah Pengguna Baru
    document.getElementById('form-create-user')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputName = document.getElementById('input-user-name');
      const inputEmail = document.getElementById('input-user-email');
      const inputPw = document.getElementById('input-user-password');
      const name = inputName ? inputName.value.trim() : '';
      const email = inputEmail ? inputEmail.value.trim() : '';
      const password = inputPw ? inputPw.value : '';

      if (!name || !email || !password) return;

      await registerOrLoginUser(name, email, password);

      if (inputName) inputName.value = '';
      if (inputEmail) inputEmail.value = '';
      if (inputPw) inputPw.value = '';
    });

    // Toggle Eye Buttons for Password Inputs
    setupPasswordToggle('btn-toggle-create-pw', 'input-user-password');
    setupPasswordToggle('btn-toggle-verify-pw', 'input-verify-password');

    // Password Prompt Modal Handlers
    const modalPwPrompt = document.getElementById('modal-password-prompt');

    document.getElementById('btn-close-pw-prompt')?.addEventListener('click', () => {
      modalPwPrompt?.classList.add('hidden');
      pendingSwitchUserId = null;
    });

    document.getElementById('btn-cancel-pw-prompt')?.addEventListener('click', () => {
      modalPwPrompt?.classList.add('hidden');
      pendingSwitchUserId = null;
    });

    modalPwPrompt?.addEventListener('click', (e) => {
      if (e.target === modalPwPrompt) {
        modalPwPrompt.classList.add('hidden');
        pendingSwitchUserId = null;
      }
    });

    document.getElementById('form-verify-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputVerifyPw = document.getElementById('input-verify-password');
      const pw = inputVerifyPw ? inputVerifyPw.value : '';
      await verifyAndSwitchUser(pw);
    });

    // Logout Button in User Modal
    document.getElementById('btn-logout-user')?.addEventListener('click', () => {
      logoutUser();
    });

    document.getElementById('btn-menu-toggle').addEventListener('click', () => {
      modalSettings.classList.remove('hidden');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      modalSettings.classList.add('hidden');
    });

    modalSettings.addEventListener('click', (e) => {
      if (e.target === modalSettings) modalSettings.classList.add('hidden');
    });

    // Backup & Export JSON
    document.getElementById('btn-download-json').addEventListener('click', () => {
      exportBackupJSON();
    });

    document.getElementById('btn-export-backup').addEventListener('click', () => {
      exportBackupJSON();
    });

    // Import JSON
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-trigger-import').addEventListener('click', () => {
      fileInput.click();
    });

    document.getElementById('btn-import-backup').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && typeof parsed === 'object') {
            db = parsed;
            saveDatabase();
            modalSettings.classList.add('hidden');
            renderAll();
            showToast('Data Berhasil Dipulihkan!');
          } else {
            alert('Format file cadangan tidak sesuai.');
          }
        } catch (err) {
          alert('Gagal membaca file JSON cadangan.');
        }
      };
      reader.readAsText(file);
    });

    // Load Sample Demo Data
    document.getElementById('btn-load-sample').addEventListener('click', () => {
      if (confirm('Muat data contoh 7 hari sebelumnya? Catatan yang ada saat ini akan digabungkan.')) {
        const samples = generateSampleDatabase();
        db = Object.assign({}, samples, db);
        saveDatabase();
        modalSettings.classList.add('hidden');
        renderAll();
        showToast('Data contoh berhasil dimuat!');
      }
    });

    // Reset Data
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('Yakin ingin mereset semua data jurnal ibadah? Tindakan ini tidak bisa dibatalkan.')) {
        db = {};
        saveDatabase();
        renderAll();
        showToast('Semua data berhasil dibersihkan.');
      }
    });

    // --- Quran Module Event Listeners ---
    // Search Surah
    document.getElementById('quran-search-surah')?.addEventListener('input', (e) => {
      quranSearchQuery = e.target.value;
      renderQuranCatalog();
    });

    // Filter Chips
    document.querySelectorAll('.qfilter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.qfilter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        quranActiveFilter = chip.getAttribute('data-filter');
        playTone(480, 'sine', 0.05, 0.05);
        renderQuranCatalog();
      });
    });

    // Back to Surah List
    document.getElementById('btn-back-to-surahs')?.addEventListener('click', () => {
      stopCurrentAudio();
      document.getElementById('quran-catalog-view')?.classList.remove('hidden');
      document.getElementById('quran-reader-view')?.classList.add('hidden');
    });

    // Prev / Next Surah
    document.getElementById('btn-prev-surah')?.addEventListener('click', () => {
      if (currentSurahNumber > 1) {
        playTone(450, 'sine', 0.06, 0.06);
        openSurahReader(currentSurahNumber - 1);
      }
    });

    document.getElementById('btn-next-surah')?.addEventListener('click', () => {
      if (currentSurahNumber < 114) {
        playTone(550, 'sine', 0.06, 0.06);
        openSurahReader(currentSurahNumber + 1);
      }
    });

    // Font Controls
    document.getElementById('btn-font-smaller')?.addEventListener('click', () => {
      quranFontSize = Math.max(1.3, quranFontSize - 0.2);
      document.querySelectorAll('.verse-arabic').forEach(el => el.style.fontSize = `${quranFontSize}rem`);
    });

    document.getElementById('btn-font-larger')?.addEventListener('click', () => {
      quranFontSize = Math.min(2.6, quranFontSize + 0.2);
      document.querySelectorAll('.verse-arabic').forEach(el => el.style.fontSize = `${quranFontSize}rem`);
    });

    // Toggles for Latin & Translation
    document.getElementById('toggle-latin')?.addEventListener('change', (e) => {
      quranShowLatin = e.target.checked;
      document.querySelectorAll('.verse-latin').forEach(el => el.classList.toggle('hidden', !quranShowLatin));
    });

    document.getElementById('toggle-arti')?.addEventListener('change', (e) => {
      quranShowArti = e.target.checked;
      document.querySelectorAll('.verse-translation').forEach(el => el.classList.toggle('hidden', !quranShowArti));
    });

    // Play Full Surah Audio
    document.getElementById('btn-play-full-audio')?.addEventListener('click', () => {
      togglePlayFullSurah();
    });

    // Mark Surah as Tadarus Done in Journal
    document.getElementById('btn-mark-tadarus-done')?.addEventListener('click', () => {
      if (!currentSurahDetail) return;
      const data = getCurrentDayData();
      data.quran.tadarusSurah = currentSurahDetail.namaLatin;
      data.quran.tadarusAin = '1';
      data.quran.tadarusDone = true;
      saveDatabase();
      playCompleteCelebrationSound();
      renderJournalForm();
      showToast(`Tadarus ${currentSurahDetail.namaLatin} ditandai selesai!`);
    });
  }

  // --- Export JSON ---
  function exportBackupJSON() {
    const jsonStr = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jurnal-ibadah-backup-${toDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('File cadangan siap diunduh');
  }

  // --- WhatsApp Share Generator ---
  function shareToWhatsApp() {
    const data = getCurrentDayData();
    const stats = calculateDayStats(data);
    const dateFormatted = formatGregorianIndo(currentDate);
    const hijriFormatted = getHijriDate(currentDate);

    let text = `🌙 *JURNAL IBADAH HARIAN (5 TINGKATAN AMAL)*\n`;
    text += `📅 ${dateFormatted} (${hijriFormatted})\n`;
    text += `⭐ *Tingkat Ibadah Hari Ini:* ${stats.rankTitle}\n`;
    text += `📊 Capaian Ibadah: *${stats.percentage}%* (${stats.totalCompleted}/${TOTAL_DAILY_ITEMS} amalan)\n`;
    text += `🔥 Rangkaian Istiqomah: *${calculateStreak()} Hari*\n`;

    const progression = getLevelProgressionStats();
    text += `🎯 *STATUS TINGKATAN (STEP-BY-STEP):*\n`;
    text += `• Level 1 Wajib: ${progression.level1.consecutive}/10 Hari ${progression.level1.isCleared ? '✅ (Tuntas)' : '⏳'}\n`;
    text += `• Level 2 Sunnah: ${progression.level2.isUnlocked ? (progression.level2.consecutive + '/10 Hari ' + (progression.level2.isCleared ? '✅' : '🔓 Aktif')) : '🔒 Terkunci'}\n`;
    text += `• Level 3 Quran: ${progression.level3.isUnlocked ? (progression.level3.consecutive + '/10 Hari ' + (progression.level3.isCleared ? '✅' : '🔓 Aktif')) : '🔒 Terkunci'}\n`;
    text += `• Level 4 Shaum: ${progression.level4.isUnlocked ? (progression.level4.completedDays + '/4 Hari ' + (progression.level4.isCleared ? '✅' : '🔓 Aktif')) : '🔒 Terkunci'}\n`;
    text += `• Level 5 Hafalan: ${progression.level5.isUnlocked ? '👑 Mahkota Terbuka' : '🔒 Terkunci'}\n\n`;

    text += `🕌 *LEVEL 1 : SHOLAT WAJIB (${stats.wajibCount}/5)*\n`;
    ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].forEach(k => {
      const itm = (data.wajib && data.wajib[k]) || { done: false, jamaah: false };
      const name = k.charAt(0).toUpperCase() + k.slice(1);
      const icon = itm.done ? '✅' : '☐';
      const jamaahTag = itm.jamaah ? ' *(Berjamaah)*' : '';
      text += `${icon} ${name}${jamaahTag}\n`;
    });

    text += `\n⭐ *LEVEL 2 : SHOLAT SUNNAH (${stats.totalSunnahCount}/11)*\n`;
    const rwt = data.rawatib || {};
    text += `_Rawatib (${stats.rawatibCount}/8):_\n`;
    text += `${rwt.qobliyahSubuh ? '✅' : '☐'} Qobliyah Subuh (2 Rakaat) [Mu'akkadah]\n`;
    text += `${rwt.qobliyahDzuhur ? '✅' : '☐'} Qobliyah Dzuhur (2/4 Rakaat) [Mu'akkadah]\n`;
    text += `${rwt.badiyahDzuhur ? '✅' : '☐'} Ba'diyah Dzuhur (2 Rakaat) [Mu'akkadah]\n`;
    text += `${rwt.qobliyahAshar ? '✅' : '☐'} Qobliyah Ashar (2 Rakaat)\n`;
    text += `${rwt.qobliyahMaghrib ? '✅' : '☐'} Qobliyah Maghrib (2 Rakaat)\n`;
    text += `${rwt.badiyahMaghrib ? '✅' : '☐'} Ba'diyah Maghrib (2 Rakaat) [Mu'akkadah]\n`;
    text += `${rwt.qobliyahIsya ? '✅' : '☐'} Qobliyah Isya (2 Rakaat)\n`;
    text += `${rwt.badiyahIsya ? '✅' : '☐'} Ba'diyah Isya (2 Rakaat) [Mu'akkadah]\n`;
    text += `_Sunnah Waktu Tertentu (${stats.sunnahCount}/3):_\n`;
    text += `${data.sunnah?.dhuha ? '✅' : '☐'} Dhuha\n`;
    text += `${data.sunnah?.tahajud ? '✅' : '☐'} Tahajud\n`;
    text += `${data.sunnah?.witir ? '✅' : '☐'} Witir\n`;

    text += `\n📖 *LEVEL 3 : BACA QURAN*\n`;
    text += `${data.quran.tadarusDone ? '✅' : '☐'} Tadarus: ${data.quran.tadarusSurah || '-'} (Ruku' ${data.quran.tadarusAin || '1'})\n`;
    if (data.quran.tadabburText) {
      text += `💡 *Tadabbur/Pelajaran:* "${data.quran.tadabburText}"\n`;
    }

    text += `\n🌙 *LEVEL 4 : SHAUM SUNNAH*\n`;
    const isShaum = data.shaum && data.shaum.puasaHariIni;
    const shaumName = data.shaum?.jenis === 'senin-kamis' ? 'Senin & Kamis'
      : data.shaum?.jenis === 'ayyamul-bidh' ? 'Yaumul Bidh (13, 14, 15 H)'
      : data.shaum?.jenis === 'daud' ? 'Puasa Daud'
      : (data.shaum?.jenis ? 'Shaum Sunnah Pilihan' : 'Puasa Sunnah');
    text += `${isShaum ? '✅ Berpuasa' : '☐ Tidak Puasa / Istirahat'}: ${isShaum ? shaumName : 'Hari Biasa'}\n`;

    text += `\n👑 *LEVEL 5 : HAFALAN QURAN PER AYAT*\n`;
    const memAyatCount = (data.quran.hafalanAyatList && data.quran.hafalanAyatList.length) || (data.quran.hafalanDone ? 1 : 0);
    text += `${data.quran.hafalanDone ? '✅' : '☐'} Hafalan Surah: ${data.quran.hafalanSurah || '-'} (${memAyatCount} Ayat)\n`;
    if (data.quran.hafalanAyat) {
      text += `🎯 Rentang: Ayat ${data.quran.hafalanAyat} [${data.quran.hafalanStatus || 'Ziyadah'}]\n`;
    }

    text += `\n🌿 *AMALAN LAIN & REFLEKSI (${stats.lainCount}/4)*\n`;
    text += `${data.lain?.wudhu ? '✅' : '☐'} Menjaga Wudhu\n`;
    text += `${data.lain?.sedekah ? '✅' : '☐'} Sedekah Subuh\n`;
    text += `${data.lain?.dzikirPagi ? '✅' : '☐'} Dzikir Pagi\n`;
    text += `${data.lain?.dzikirPetang ? '✅' : '☐'} Dzikir Petang\n`;

    if (data.mood) {
      text += `\n💖 *Kondisi Hati:* ${data.mood.toUpperCase()}\n`;
    }

    if (data.notes) {
      text += `\n📝 *Refleksi Hari Ini:*\n"${data.notes}"\n`;
    }

    if (data.targetBesok) {
      text += `\n🎯 *Target Besok:*\n"${data.targetBesok}"\n`;
    }

    text += `\n_Dicatat dengan Aplikasi Jurnal Ibadah Harian - AMWA (Al Muhajirin Wal Anshor)_`;

    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    
    // Try to open WhatsApp, or copy text if blocked
    const win = window.open(waUrl, '_blank');
    if (!win) {
      navigator.clipboard?.writeText(text);
      showToast('Teks ringkasan disalin ke clipboard!');
    }
  }

  // --- Initializer ---
  window.addEventListener('DOMContentLoaded', async () => {
    initEvents();
    renderAll();

    const isConnected = await checkBackendStatus();
    if (isConnected) {
      await syncUsersFromBackend();
      const activeId = getActiveUserId();
      if (activeId) {
        await loadUserJournalFromBackend(activeId);
        renderAll();
      }
    }
  });

})();
