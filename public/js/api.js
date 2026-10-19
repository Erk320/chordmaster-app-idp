/**
 * ChordMaster Live - Cliente API REST con Soporte para Render.com y Modo Offline
 */

const STORAGE_KEYS = {
  SONGS: 'chordmaster_songs_cache',
  SETLISTS: 'chordmaster_setlists_cache',
  SYNC_INFO: 'chordmaster_sync_info',
  ADMIN_PIN: 'chordmaster_admin_pin',
  IS_ADMIN: 'chordmaster_is_admin',
  CLOUD_URL: 'chordmaster_cloud_url',
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

    // Iniciar verificación automática cada 8 segundos
    this.startPolling(8000);
  }

  // Obtener URL base de la API (Render o local)
  getApiBase() {
    const customCloudUrl = localStorage.getItem(STORAGE_KEYS.CLOUD_URL);
    if (customCloudUrl && customCloudUrl.trim()) {
      let clean = customCloudUrl.trim().replace(/\/+$/, '');
      return `${clean}/api`;
    }
    return '/api';
  }

  getCloudUrl() {
    return localStorage.getItem(STORAGE_KEYS.CLOUD_URL) || '';
  }

  setCloudUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEYS.CLOUD_URL);
    } else {
      let clean = url.trim().replace(/\/+$/, '');
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      localStorage.setItem(STORAGE_KEYS.CLOUD_URL, clean);
    }
    return this.getApiBase();
  }

  async testConnection(url) {
    let clean = url ? url.trim().replace(/\/+$/, '') : '';
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    const target = clean ? `${clean}/api/sync/status` : `${this.getApiBase()}/sync/status`;

    try {
      const res = await fetch(target, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
      return { success: false, error: `Error del servidor HTTP ${res.status}` };
    } catch (err) {
      return { success: false, error: err.message || 'No se pudo conectar con el servidor' };
    }
  }

  // --- ESTADO EN LÍNEA & SUSCRIPCIÓN DE SINCRONIZACIÓN ---
  onSync(callback) {
    this.syncListeners.push(callback);
  }

  triggerSyncUpdate(syncInfo) {
    this.syncListeners.forEach(cb => {
      try { cb(syncInfo); } catch (e) { console.error('Error en listener de sincronización:', e); }
    });
  }

  triggerOnlineStatus(isOnline) {
    const toast = document.getElementById('connection-status-toast');
    if (toast) {
      toast.textContent = isOnline ? '🟢 Conectado en línea' : '🟡 Modo sin conexión (usando memoria local)';
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
      const res = await fetch(`${this.getApiBase()}/sync/status`, { cache: 'no-store' });
      if (!res.ok) return;
      const status = await res.json();
      
      const storedVersion = localStorage.getItem(STORAGE_KEYS.SYNC_INFO);
      if (storedVersion && Number(storedVersion) !== status.version) {
        console.log('🔄 ¡Cambio remoto detectado! Actualizando catálogo...');
        localStorage.setItem(STORAGE_KEYS.SYNC_INFO, status.version);
        this.triggerSyncUpdate(status);
      } else if (!storedVersion) {
        localStorage.setItem(STORAGE_KEYS.SYNC_INFO, status.version);
      }
    } catch (err) {
      // Ignorar pequeños fallos de red
    }
  }

  // --- CREDENCIALES DE ADMINISTRADOR ---
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
      const res = await fetch(`${this.getApiBase()}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setAdminState(true, pin);
        return { success: true };
      }
      return { success: false, error: data.error || 'PIN de administrador incorrecto' };
    } catch (err) {
      if (pin === '1234') {
        this.setAdminState(true, pin);
        return { success: true, offline: true };
      }
      return { success: false, error: 'Error de red o PIN inválido' };
    }
  }

  // --- CANCIONES ---
  async getSongs() {
    try {
      const res = await fetch(`${this.getApiBase()}/songs`);
      if (res.ok) {
        const songs = await res.json();
        localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
        return songs;
      }
    } catch (err) {
      console.warn('Fallo de red, cargando canciones desde caché local');
    }

    const cached = localStorage.getItem(STORAGE_KEYS.SONGS);
    return cached ? JSON.parse(cached) : [];
  }

  async getSong(id) {
    try {
      const res = await fetch(`${this.getApiBase()}/songs/${id}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Fallo de red, buscando canción en memoria local');
    }

    const songs = await this.getSongs();
    return songs.find(s => s.id === id) || null;
  }

  async createSong(songData) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${this.getApiBase()}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ ...songData, adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo crear la canción');
    }
    return await res.json();
  }

  async updateSong(id, songData) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${this.getApiBase()}/songs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ ...songData, adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo actualizar la canción');
    }
    return await res.json();
  }

  async deleteSong(id) {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${this.getApiBase()}/songs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin
      },
      body: JSON.stringify({ adminPin: pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo eliminar la canción');
    }
    return await res.json();
  }

  // --- REPERTORIOS (SETLISTS) ---
  async getSetlists() {
    try {
      const res = await fetch(`${this.getApiBase()}/setlists`);
      if (res.ok) {
        const setlists = await res.json();
        localStorage.setItem(STORAGE_KEYS.SETLISTS, JSON.stringify(setlists));
        return setlists;
      }
    } catch (err) {
      console.warn('Fallo de red, cargando repertorios desde caché local');
    }

    const cached = localStorage.getItem(STORAGE_KEYS.SETLISTS);
    return cached ? JSON.parse(cached) : [];
  }

  async getSetlist(id) {
    try {
      const res = await fetch(`${this.getApiBase()}/setlists/${id}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Fallo de red, buscando repertorio en caché local');
    }

    const setlists = await this.getSetlists();
    const found = setlists.find(sl => sl.id === id);
    if (!found) return null;

    const allSongs = await this.getSongs();
    const populated = (found.songIds || []).map(sId => allSongs.find(s => s.id === sId)).filter(Boolean);
    return { ...found, songs: populated };
  }

  async saveSetlist(setlistData) {
    const isNew = !setlistData.id || setlistData.id.startsWith('new-');
    const url = isNew ? `${this.getApiBase()}/setlists` : `${this.getApiBase()}/setlists/${setlistData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setlistData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo guardar el repertorio');
    }
    return await res.json();
  }

  async deleteSetlist(id) {
    const res = await fetch(`${this.getApiBase()}/setlists/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo eliminar el repertorio');
    }
    return await res.json();
  }

  // --- NOTAS PERSONALES INDEPENDIENTES POR CANCIÓN ---
  getPersonalNotes(songId) {
    return localStorage.getItem(`${STORAGE_KEYS.PERSONAL_NOTES_PREFIX}${songId}`) || '';
  }

  savePersonalNotes(songId, notes) {
    localStorage.setItem(`${STORAGE_KEYS.PERSONAL_NOTES_PREFIX}${songId}`, notes);
    return true;
  }

  // --- INFORMACIÓN DE RED Y QR ---
  async getNetworkInfo() {
    try {
      const res = await fetch(`${this.getApiBase()}/network-info`);
      if (res.ok) return await res.json();
    } catch (err) {}

    return {
      localIp: 'localhost',
      port: 3000,
      fullUrl: window.location.origin,
      qrDataUrl: null
    };
  }

  async resetToStarters() {
    const pin = this.getStoredAdminPin();
    const res = await fetch(`${this.getApiBase()}/admin/reset-starter`, {
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
