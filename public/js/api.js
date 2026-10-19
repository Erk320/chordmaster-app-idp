/**
 * ChordMaster Live - REST API Client with Offline Caching & Auto-Sync
 */

const API_BASE = '/api';
const STORAGE_KEYS = {
  SONGS: 'chordmaster_songs_cache',
  SETLISTS: 'chordmaster_setlists_cache',
  SYNC_INFO: 'chordmaster_sync_info',
  ADMIN_PIN: 'chordmaster_admin_pin',
  IS_ADMIN: 'chordmaster_is_admin',
  PERSONAL_NOTES_PREFIX: 'chordmaster_notes_'
};

class ApiService {
  constructor() {
    this.syncListeners = [];
    this.lastVersion = null;
    this.pollInterval = null;
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerOnlineStatus(true);
      this.checkSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.triggerOnlineStatus(false);
    });

    // Start auto-sync checking every 8 seconds
    this.startPolling(8000);
  }

  // --- ONLINE STATUS & SYNC SUBSCRIBERS ---
  onSync(callback) {
    this.syncListeners.push(callback);
  }

  triggerSyncUpdate(syncInfo) {
    this.syncListeners.forEach(cb => {
      try { cb(syncInfo); } catch (e) { console.error('Sync listener error:', e); }
    });
  }

  triggerOnlineStatus(isOnline) {
    const toast = document.getElementById('connection-status-toast');
    if (toast) {
      toast.textContent = isOnline ? '🟢 Connected online' : '🟡 Offline mode (using local cache)';
      toast.className = `status-toast ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'} text-white visible`;
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 3500);
    }
  }

  startPolling(intervalMs = 8000) {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkSync();
      }
    }, intervalMs);
  }

  async checkSync() {
    try {
      const res = await fetch(`${API_BASE}/sync/status`, { cache: 'no-store' });
      if (!res.ok) return;
      const status = await res.json();
      
      const storedVersion = localStorage.getItem(STORAGE_KEYS.SYNC_INFO);
      if (storedVersion && Number(storedVersion) !== status.version) {
        console.log('🔄 Remote library update detected! Refreshing cache...');
        localStorage.setItem(STORAGE_KEYS.SYNC_INFO, status.version);
        this.triggerSyncUpdate(status);
      } else if (!storedVersion) {
        localStorage.setItem(STORAGE_KEYS.SYNC_INFO, status.version);
      }
    } catch (err) {
      // Quiet fail on network hiccup
    }
  }

  // --- ADMIN CREDENTIALS ---
  getStoredAdminPin() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '';
  }

  isAdminActive() {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
  }

  setAdminState(isActive, pin = '') {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isActive ? 'true' : 'false');
    if (pin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
    } else if (!isActive) {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_PIN);
    }
  }

  async verifyAdmin(pin) {
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setAdminState(true, pin);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid PIN' };
    } catch (err) {
      // Local fallback check
      if (pin === '1234') {
        this.setAdminState(true, pin);
        return { success: true, offline: true };
      }
      return { success: false, error: 'Network error or invalid PIN' };
    }
  }

  // --- SONGS ---
  async getSongs() {
    try {
      const res = await fetch(`${API_BASE}/songs`);
      if (res.ok) {
        const songs = await res.json();
        localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
        return songs;
      }
    } catch (err) {
      console.warn('Network fetch failed, loading songs from offline cache');
    }

    // Fallback to cache
    const cached = localStorage.getItem(STORAGE_KEYS.SONGS);
    return cached ? JSON.parse(cached) : [];
  }

  async getSong(id) {
    try {
      const res = await fetch(`${API_BASE}/songs/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Network fetch failed, reading song from cache');
    }

    const songs = await this.getSongs();
    return songs.find(s => s.id === id) || null;
  }

  async createSong(songData) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ ...songData, adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create song');
    }
    return await res.json();
  }

  async updateSong(id, songData) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ ...songData, adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update song');
    }
    return await res.json();
  }

  async deleteSong(id) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete song');
    }
    return await res.json();
  }

  // --- SETLISTS ---
  async getSetlists() {
    try {
      const res = await fetch(`${API_BASE}/setlists`);
      if (res.ok) {
        const setlists = await res.json();
        localStorage.setItem(STORAGE_KEYS.SETLISTS, JSON.stringify(setlists));
        return setlists;
      }
    } catch (err) {
      console.warn('Network fetch failed, loading setlists from cache');
    }

    const cached = localStorage.getItem(STORAGE_KEYS.SETLISTS);
    return cached ? JSON.parse(cached) : [];
  }

  async getSetlist(id) {
    try {
      const res = await fetch(`${API_BASE}/setlists/${id}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Network fetch failed, reading setlist from cache');
    }

    const setlists = await this.getSetlists();
    const found = setlists.find(sl => sl.id === id);
    if (!found) return null;

    // Attach songs from cache
    const allSongs = await this.getSongs();
    const populated = (found.songIds || []).map(sId => allSongs.find(s => s.id === sId)).filter(Boolean);
    return { ...found, songs: populated };
  }

  async saveSetlist(setlistData) {
    const isNew = !setlistData.id || setlistData.id.startsWith('new-');
    const url = isNew ? `${API_BASE}/setlists` : `${API_BASE}/setlists/${setlistData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setlistData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save setlist');
    }
    return await res.json();
  }

  async deleteSetlist(id) {
    const res = await fetch(`${API_BASE}/setlists/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete setlist');
    }
    return await res.json();
  }

  // --- INDEPENDENT PERSONAL NOTES PER SONG ---
  getPersonalNotes(songId) {
    return localStorage.getItem(`${STORAGE_KEYS.PERSONAL_NOTES_PREFIX}${songId}`) || '';
  }

  savePersonalNotes(songId, notes) {
    localStorage.setItem(`${STORAGE_KEYS.PERSONAL_NOTES_PREFIX}${songId}`, notes);
    return true;
  }

  // --- NETWORK & QR CODE ---
  async getNetworkInfo() {
    try {
      const res = await fetch(`${API_BASE}/network-info`);
      if (res.ok) return await res.json();
    } catch (err) {
      // ignore
    }
    return {
      localIp: 'localhost',
      port: 3000,
      fullUrl: window.location.origin,
      qrDataUrl: null
    };
  }

  async resetToStarters() {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${API_BASE}/admin/reset-starter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ adminPin: pin })
    });
    return await res.json();
  }
}

window.apiService = new ApiService();
