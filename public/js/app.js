/**
 * ChordMaster Live - Controlador Principal de la Aplicación en Español
 */

// Estado Global de la Aplicación
const state = {
  currentView: 'songs', // 'songs', 'song-detail', 'setlists', 'setlist-detail'
  songs: [],
  filteredSongs: [],
  currentSong: null,
  currentKeySemitones: 0,
  fontSize: 18,
  capoFret: 0,
  setlists: [],
  currentSetlist: null,
  currentSetlistIndex: 0,
  isLiveMode: false,
  searchQuery: '',
  selectedKeyFilter: 'ALL',
  selectedTagFilter: 'ALL',
  sortBy: 'title',
  activeNotesTab: 'personal',
  isAdmin: false,
  autoScroll: {
    isPlaying: false,
    speed: 1.5,
    interval: null
  },
  metronome: {
    isPlaying: false,
    bpm: 120,
    interval: null,
    audioCtx: null
  }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar estado de Administrador
  state.isAdmin = window.apiService.isAdminActive();
  updateAdminUI();

  // Cargar Canciones y Repertorios Iniciales
  await loadSongs();
  await loadSetlists();

  // Configurar Eventos y Oyentes
  setupNavigation();
  setupSearchAndFilters();
  setupScrollController();
  setupSwipeGestures();

  // Escuchar actualizaciones remotas en tiempo real
  window.apiService.onSync(async (syncInfo) => {
    showToast('🔄 ¡Canciones actualizadas por el Administrador!', 'info');
    await loadSongs(true);
    await loadSetlists(true);
    if (state.currentSong) {
      const refreshed = state.songs.find(s => s.id === state.currentSong.id);
      if (refreshed) {
        state.currentSong = refreshed;
        renderSongDetail();
      }
    }
  });

  // Manejar rutas con hash (ej. #song/song-1)
  handleRouteHash();
  window.addEventListener('hashchange', handleRouteHash);
});

// ==================== CARGA DE DATOS ====================
async function loadSongs(silent = false) {
  try {
    state.songs = await window.apiService.getSongs();
    applyFilters();
    renderSongGrid();
    renderFilterChips();
  } catch (err) {
    if (!silent) showToast('No se pudieron cargar las canciones de la red', 'error');
  }
}

async function loadSetlists(silent = false) {
  try {
    state.setlists = await window.apiService.getSetlists();
    renderSetlistsList();
  } catch (err) {
    if (!silent) showToast('No se pudieron cargar los repertorios', 'error');
  }
}

// ==================== ENRUTAMIENTO Y VISTAS ====================
function switchView(viewName) {
  state.currentView = viewName;
  stopAutoScroll();
  stopMetronome();

  document.querySelectorAll('.view-screen').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.remove('hidden');

  // Actualizar barra de navegación móvil inferior
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function handleRouteHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) {
    switchView('songs');
    return;
  }

  if (hash.startsWith('song/')) {
    const id = hash.replace('song/', '');
    openSongById(id);
  } else if (hash.startsWith('setlist/')) {
    const id = hash.replace('setlist/', '');
    openSetlistById(id);
  } else if (hash === 'setlists') {
    switchView('setlists');
  } else if (hash === 'qr') {
    openQrShareModal();
  } else {
    switchView('songs');
  }
}

// ==================== BÚSQUEDA Y FILTROS ====================
function setupSearchAndFilters() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const sortSelect = document.getElementById('sort-select');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      clearBtn.style.display = state.searchQuery ? 'block' : 'none';
      applyFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      clearBtn.style.display = 'none';
      applyFilters();
      searchInput.focus();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });
  }
}

function renderFilterChips() {
  const container = document.getElementById('filter-chips-container');
  if (!container) return;

  const keys = Array.from(new Set(state.songs.map(s => s.key).filter(Boolean))).sort();

  let html = `
    <button class="chip-btn ${state.selectedKeyFilter === 'ALL' ? 'active' : ''}" onclick="setKeyFilter('ALL')">Todos los Tonos</button>
  `;

  keys.forEach(k => {
    html += `
      <button class="chip-btn ${state.selectedKeyFilter === k ? 'active' : ''}" onclick="setKeyFilter('${k}')">Tono: ${k}</button>
    `;
  });

  container.innerHTML = html;
}

window.setKeyFilter = function(key) {
  state.selectedKeyFilter = key;
  renderFilterChips();
  applyFilters();
};

function applyFilters() {
  let list = [...state.songs];

  // 1. Búsqueda por texto (Título, Artista, Tono, Letra)
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(song => {
      const matchTitle = (song.title || '').toLowerCase().includes(q);
      const matchArtist = (song.artist || '').toLowerCase().includes(q);
      const matchKey = (song.key || '').toLowerCase().includes(q);
      const matchLyrics = (song.content || '').toLowerCase().includes(q);
      return matchTitle || matchArtist || matchKey || matchLyrics;
    });
  }

  // 2. Filtro de Tono
  if (state.selectedKeyFilter !== 'ALL') {
    list = list.filter(song => song.key === state.selectedKeyFilter);
  }

  // 3. Criterio de Ordenación
  if (state.sortBy === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (state.sortBy === 'artist') {
    list.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
  } else if (state.sortBy === 'key') {
    list.sort((a, b) => (a.key || '').localeCompare(b.key || ''));
  } else if (state.sortBy === 'recent') {
    list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  state.filteredSongs = list;
  renderSongGrid();
}

function renderSongGrid() {
  const grid = document.getElementById('songs-grid');
  const countEl = document.getElementById('songs-count-badge');
  if (!grid) return;

  if (countEl) {
    countEl.textContent = `${state.filteredSongs.length} canción${state.filteredSongs.length === 1 ? '' : 'es'}`;
  }

  if (state.filteredSongs.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400">
        <p class="text-lg font-semibold">No se encontraron canciones</p>
        <p class="text-sm mt-1">Prueba con otra palabra clave o agrega una nueva canción.</p>
        ${state.isAdmin ? `<button onclick="openSongEditorModal()" class="btn btn-primary mt-4">+ Agregar Nueva Canción</button>` : ''}
      </div>
    `;
    return;
  }

  grid.innerHTML = state.filteredSongs.map(song => `
    <div class="song-card" onclick="openSongById('${song.id}')">
      <div>
        <div class="flex items-start justify-between">
          <h3 class="song-card-title">${escapeHtml(song.title)}</h3>
          <span class="key-pill">${escapeHtml(song.key || 'C')}</span>
        </div>
        <p class="song-card-artist">${escapeHtml(song.artist || 'Artista Desconocido')}</p>
      </div>

      <div class="song-card-meta">
        <span class="tempo-pill">
          <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          ${song.tempo || 120} BPM · ${song.timeSignature || '4/4'}
        </span>
        <div class="flex gap-1">
          ${(song.tags || []).slice(0, 2).map(tag => `<span class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== VISOR DE CANCIÓN Y ACORDES ====================
async function openSongById(id) {
  const song = state.songs.find(s => s.id === id) || await window.apiService.getSong(id);
  if (!song) {
    showToast('Canción no encontrada', 'error');
    switchView('songs');
    return;
  }

  state.currentSong = song;
  state.currentKeySemitones = 0;
  state.capoFret = 0;
  window.location.hash = `song/${id}`;
  switchView('song-detail');
  renderSongDetail();
}

function renderSongDetail() {
  const song = state.currentSong;
  if (!song) return;

  const titleEl = document.getElementById('viewer-title');
  const artistEl = document.getElementById('viewer-artist');
  const keyDisplayEl = document.getElementById('viewer-current-key');
  const capoInfoEl = document.getElementById('viewer-capo-info');
  const capoLabelEl = document.getElementById('capo-number-label');
  const contentEl = document.getElementById('viewer-sheet-content');
  const bpmEl = document.getElementById('viewer-bpm-display');

  if (titleEl) titleEl.textContent = song.title;
  if (artistEl) artistEl.textContent = song.artist || 'Artista Desconocido';
  if (bpmEl) bpmEl.textContent = `${song.tempo || 120} BPM (${song.timeSignature || '4/4'})`;

  // Calcular tono transportado
  const originalKey = song.key || 'C';
  const transposedKey = window.ChordEngine.transposeNote(originalKey, state.currentKeySemitones);
  if (keyDisplayEl) {
    keyDisplayEl.textContent = `Tono: ${transposedKey} ${state.currentKeySemitones !== 0 ? `(${state.currentKeySemitones > 0 ? '+' : ''}${state.currentKeySemitones})` : ''}`;
  }

  // Guía de Cejilla / Capo
  if (capoLabelEl) {
    capoLabelEl.textContent = state.capoFret === 0 ? 'Ninguno' : `Traste ${state.capoFret}`;
  }

  if (capoInfoEl) {
    if (state.capoFret > 0) {
      const chordsShapeKey = window.ChordEngine.transposeNote(originalKey, -state.capoFret);
      capoInfoEl.textContent = `🎸 Capo en Traste ${state.capoFret} (Tocar figuras de ${chordsShapeKey} para sonar en ${transposedKey})`;
      capoInfoEl.classList.remove('hidden');
    } else {
      capoInfoEl.classList.add('hidden');
    }
  }

  // Renderizar acordes y letra
  if (contentEl) {
    contentEl.style.setProperty('--font-size-chords', `${state.fontSize}px`);
    contentEl.innerHTML = window.ChordEngine.renderSongHTML(song.content, state.currentKeySemitones, transposedKey);

    // Abrir diagrama al tocar un acorde
    contentEl.querySelectorAll('.chord-token').forEach(token => {
      token.addEventListener('click', (e) => {
        const chordName = e.target.getAttribute('data-chord');
        openChordDiagramModal(chordName);
      });
    });
  }

  // Renderizar Notas
  renderNotesSection();

  // Acciones de Administrador
  const adminBar = document.getElementById('viewer-admin-actions');
  if (adminBar) {
    adminBar.classList.toggle('hidden', !state.isAdmin);
  }

  // Controles de Modo Escenario
  const liveBar = document.getElementById('setlist-live-stepper-bar');
  if (liveBar) {
    liveBar.classList.toggle('hidden', !state.isLiveMode);
    if (state.isLiveMode && state.currentSetlist) {
      renderLiveStepper();
    }
  }
}

// Controles de Transporte de Tono (+/-)
window.transpose = function(delta) {
  state.currentKeySemitones = (state.currentKeySemitones + delta);
  if (state.currentKeySemitones > 11) state.currentKeySemitones -= 12;
  if (state.currentKeySemitones < -11) state.currentKeySemitones += 12;
  renderSongDetail();
};

window.resetTranspose = function() {
  state.currentKeySemitones = 0;
  state.capoFret = 0;
  renderSongDetail();
};

// Ciclar Cejilla / Capo (0 a 7 trastes)
window.cycleCapo = function() {
  state.capoFret = (state.capoFret + 1) % 8;
  renderSongDetail();
};

// Ajustar Tamaño de Letra (A- / A+)
window.adjustFontSize = function(delta) {
  state.fontSize = Math.max(12, Math.min(32, state.fontSize + delta));
  const contentEl = document.getElementById('viewer-sheet-content');
  if (contentEl) {
    contentEl.style.setProperty('--font-size-chords', `${state.fontSize}px`);
  }
};

// ==================== CONTROLADOR DE AUTO-SCROLL ====================
function setupScrollController() {
  const playBtn = document.getElementById('scroll-play-btn');
  const slider = document.getElementById('scroll-speed-slider');
  const speedLabel = document.getElementById('scroll-speed-label');

  if (playBtn) {
    playBtn.addEventListener('click', toggleAutoScroll);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      state.autoScroll.speed = parseFloat(e.target.value);
      if (speedLabel) speedLabel.textContent = `${state.autoScroll.speed}x`;
      if (state.autoScroll.isPlaying) {
        startAutoScroll();
      }
    });
  }
}

window.toggleAutoScroll = function() {
  if (state.autoScroll.isPlaying) {
    stopAutoScroll();
  } else {
    startAutoScroll();
  }
};

function startAutoScroll() {
  stopAutoScroll();
  state.autoScroll.isPlaying = true;

  const playBtn = document.getElementById('scroll-play-btn');
  if (playBtn) {
    playBtn.classList.add('playing');
    playBtn.innerHTML = '⏸';
  }

  const stepMs = 40;
  state.autoScroll.interval = setInterval(() => {
    const scrollAmount = state.autoScroll.speed * 1.5;
    window.scrollBy({ top: scrollAmount, behavior: 'instant' });

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 5) {
      stopAutoScroll();
    }
  }, stepMs);
}

function stopAutoScroll() {
  state.autoScroll.isPlaying = false;
  if (state.autoScroll.interval) {
    clearInterval(state.autoScroll.interval);
    state.autoScroll.interval = null;
  }
  const playBtn = document.getElementById('scroll-play-btn');
  if (playBtn) {
    playBtn.classList.remove('playing');
    playBtn.innerHTML = '▶';
  }
}

// ==================== NOTAS INDEPENDIENTES DEL MÚSICO ====================
function renderNotesSection() {
  if (!state.currentSong) return;

  const textarea = document.getElementById('song-notes-textarea');
  const statusEl = document.getElementById('notes-save-status');
  const personalTabBtn = document.getElementById('notes-tab-personal');
  const bandTabBtn = document.getElementById('notes-tab-band');

  if (!textarea) return;

  if (state.activeNotesTab === 'personal') {
    personalTabBtn?.classList.add('active');
    bandTabBtn?.classList.remove('active');
    textarea.value = window.apiService.getPersonalNotes(state.currentSong.id);
    textarea.placeholder = "Escribe tus apuntes personales (ej. Capo 3, Solo de guitarra tras coro 2, entrar en compás 4). Se guardan automáticamente en este celular.";
    textarea.readOnly = false;
  } else {
    personalTabBtn?.classList.remove('active');
    bandTabBtn?.classList.add('active');
    textarea.value = state.currentSong.notes || '';
    textarea.placeholder = state.isAdmin ? "Notas generales para toda la banda sincronizadas en la nube." : "Notas generales de la banda establecidas por el Administrador.";
    textarea.readOnly = !state.isAdmin;
  }

  if (statusEl) statusEl.textContent = 'Guardado localmente';

  textarea.oninput = debounce(() => {
    if (state.activeNotesTab === 'personal') {
      window.apiService.savePersonalNotes(state.currentSong.id, textarea.value);
      if (statusEl) {
        statusEl.textContent = '✓ Guardado en tu celular';
        statusEl.className = 'text-emerald-400 font-semibold';
      }
    } else if (state.isAdmin) {
      state.currentSong.notes = textarea.value;
      window.apiService.updateSong(state.currentSong.id, { notes: textarea.value });
      if (statusEl) {
        statusEl.textContent = '✓ Sincronizado en la nube para la banda';
        statusEl.className = 'text-emerald-400 font-semibold';
      }
    }
  }, 400);
}

window.switchNotesTab = function(tab) {
  state.activeNotesTab = tab;
  renderNotesSection();
};

// ==================== METRÓNOMO Y AUDIO ====================
window.toggleMetronome = function() {
  if (state.metronome.isPlaying) {
    stopMetronome();
  } else {
    startMetronome();
  }
};

function startMetronome() {
  stopMetronome();
  const bpm = state.currentSong?.tempo || 120;
  state.metronome.bpm = bpm;
  state.metronome.isPlaying = true;

  const btn = document.getElementById('metronome-btn');
  if (btn) btn.classList.add('btn-gold');

  if (!state.metronome.audioCtx) {
    state.metronome.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const intervalMs = (60 / bpm) * 1000;
  let beat = 0;

  playClickSound(true);

  state.metronome.interval = setInterval(() => {
    beat = (beat + 1) % 4;
    playClickSound(beat === 0);
  }, intervalMs);
}

function stopMetronome() {
  state.metronome.isPlaying = false;
  if (state.metronome.interval) {
    clearInterval(state.metronome.interval);
    state.metronome.interval = null;
  }
  const btn = document.getElementById('metronome-btn');
  if (btn) btn.classList.remove('btn-gold');
}

function playClickSound(isHigh) {
  try {
    const ctx = state.metronome.audioCtx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {}
}

// ==================== REPERTORIOS Y MODO ESCENARIO ====================
function renderSetlistsList() {
  const container = document.getElementById('setlists-list');
  if (!container) return;

  if (state.setlists.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p class="text-lg font-semibold">No hay repertorios creados aún</p>
        <button onclick="openSetlistEditorModal()" class="btn btn-primary mt-4">+ Crear Primer Repertorio</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.setlists.map(sl => `
    <div class="setlist-card" onclick="openSetlistById('${sl.id}')">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-100">${escapeHtml(sl.name)}</h3>
          <p class="text-sm text-slate-400 mt-1">${escapeHtml(sl.description || 'Repertorio en Vivo')}</p>
        </div>
        <span class="bg-blue-900/40 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">
          ${(sl.songIds || []).length} canciones
        </span>
      </div>
      <div class="mt-4 flex gap-2">
        <button onclick="event.stopPropagation(); startLiveSetlist('${sl.id}')" class="btn btn-gold text-sm py-1.5 px-3">
          ⚡ Iniciar Modo Escenario
        </button>
      </div>
    </div>
  `).join('');
}

async function openSetlistById(id) {
  const setlist = await window.apiService.getSetlist(id);
  if (!setlist) {
    showToast('Repertorio no encontrado', 'error');
    return;
  }

  state.currentSetlist = setlist;
  window.location.hash = `setlist/${id}`;
  switchView('setlist-detail');
  renderSetlistDetail();
}

function renderSetlistDetail() {
  const sl = state.currentSetlist;
  if (!sl) return;

  document.getElementById('setlist-title').textContent = sl.name;
  document.getElementById('setlist-desc').textContent = sl.description || '';

  const songsListEl = document.getElementById('setlist-songs-container');
  if (!songsListEl) return;

  const songs = sl.songs || [];
  if (songs.length === 0) {
    songsListEl.innerHTML = `<p class="text-slate-400 italic py-4">No hay canciones en este repertorio.</p>`;
    return;
  }

  songsListEl.innerHTML = songs.map((song, idx) => `
    <div class="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 mb-2">
      <div class="flex items-center gap-3 cursor-pointer flex-1" onclick="openSongFromSetlist(${idx})">
        <span class="text-amber-400 font-extrabold text-sm w-6">${idx + 1}.</span>
        <div>
          <h4 class="font-bold text-slate-100 text-sm">${escapeHtml(song.title)}</h4>
          <p class="text-xs text-slate-400">${escapeHtml(song.artist || '')} · Tono: ${song.key || 'C'}</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="moveSetlistSong(${idx}, -1)" class="p-1 text-slate-400 hover:text-white" title="Subir">▲</button>
        <button onclick="moveSetlistSong(${idx}, 1)" class="p-1 text-slate-400 hover:text-white" title="Bajar">▼</button>
        <button onclick="removeSongFromSetlist(${idx})" class="p-1 text-rose-400 hover:text-rose-300 ml-2" title="Quitar">✕</button>
      </div>
    </div>
  `).join('');
}

window.startLiveSetlist = async function(setlistId) {
  const setlist = await window.apiService.getSetlist(setlistId);
  if (!setlist || !setlist.songs || setlist.songs.length === 0) {
    showToast('Agrega al menos una canción al repertorio', 'error');
    return;
  }

  state.currentSetlist = setlist;
  state.isLiveMode = true;
  state.currentSetlistIndex = 0;
  openSongFromSetlist(0);
};

function openSongFromSetlist(index) {
  if (!state.currentSetlist || !state.currentSetlist.songs[index]) return;
  state.currentSetlistIndex = index;
  state.currentSong = state.currentSetlist.songs[index];
  state.currentKeySemitones = 0;
  state.capoFret = 0;
  switchView('song-detail');
  renderSongDetail();
}

function renderLiveStepper() {
  const sl = state.currentSetlist;
  const idx = state.currentSetlistIndex;
  const total = sl.songs.length;

  const prevBtn = document.getElementById('live-prev-btn');
  const nextBtn = document.getElementById('live-next-btn');
  const counterEl = document.getElementById('live-song-counter');

  if (counterEl) {
    counterEl.textContent = `Canción ${idx + 1} de ${total}`;
  }

  if (prevBtn) {
    prevBtn.disabled = idx === 0;
    const prevSong = sl.songs[idx - 1];
    prevBtn.innerHTML = `◀ ${prevSong ? escapeHtml(prevSong.title.slice(0, 10)) : 'Anterior'}`;
  }

  if (nextBtn) {
    nextBtn.disabled = idx === total - 1;
    const nextSong = sl.songs[idx + 1];
    nextBtn.innerHTML = `${nextSong ? escapeHtml(nextSong.title.slice(0, 10)) : 'Siguiente'} ▶`;
  }
}

window.liveNextSong = function() {
  if (state.currentSetlist && state.currentSetlistIndex < state.currentSetlist.songs.length - 1) {
    openSongFromSetlist(state.currentSetlistIndex + 1);
  }
};

window.livePrevSong = function() {
  if (state.currentSetlist && state.currentSetlistIndex > 0) {
    openSongFromSetlist(state.currentSetlistIndex - 1);
  }
};

window.exitLiveMode = function() {
  state.isLiveMode = false;
  const liveBar = document.getElementById('setlist-live-stepper-bar');
  if (liveBar) liveBar.classList.add('hidden');
  showToast('Saliste del Modo Escenario', 'info');
};

window.moveSetlistSong = async function(index, delta) {
  const sl = state.currentSetlist;
  const target = index + delta;
  if (target < 0 || target >= sl.songIds.length) return;

  const temp = sl.songIds[index];
  sl.songIds[index] = sl.songIds[target];
  sl.songIds[target] = temp;

  await window.apiService.saveSetlist(sl);
  await openSetlistById(sl.id);
};

window.removeSongFromSetlist = async function(index) {
  const sl = state.currentSetlist;
  sl.songIds.splice(index, 1);
  await window.apiService.saveSetlist(sl);
  await openSetlistById(sl.id);
};

// ==================== GESTOS TÁCTILES EN PANTALLAS ====================
function setupSwipeGestures() {
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (state.isLiveMode && Math.abs(diff) > 75) {
      if (diff < 0) {
        liveNextSong();
      } else {
        livePrevSong();
      }
    }
  }
}

// ==================== ADMINISTRADOR ====================
function updateAdminUI() {
  const badge = document.getElementById('admin-badge-indicator');
  const addFab = document.getElementById('admin-fab-add');
  const adminMenuBtn = document.getElementById('admin-toggle-btn');

  if (badge) {
    badge.className = `admin-badge ${state.isAdmin ? 'active' : 'inactive'}`;
    badge.textContent = state.isAdmin ? 'Admin Activo' : 'Modo Lector';
  }

  if (addFab) {
    addFab.style.display = state.isAdmin ? 'flex' : 'none';
  }

  if (adminMenuBtn) {
    adminMenuBtn.textContent = state.isAdmin ? 'Admin: ON' : 'Acceso Admin';
  }
}

window.openAdminLoginModal = function() {
  const dialog = document.getElementById('admin-login-dialog');
  if (dialog) dialog.showModal();
};

window.submitAdminLogin = async function(e) {
  e.preventDefault();
  const pinInput = document.getElementById('admin-pin-input');
  const pin = pinInput.value.trim();

  const res = await window.apiService.verifyAdmin(pin);
  if (res.success) {
    state.isAdmin = true;
    updateAdminUI();
    document.getElementById('admin-login-dialog').close();
    showToast('¡Modo Administrador Desbloqueado!', 'success');
    renderSongGrid();
    if (state.currentSong) renderSongDetail();
  } else {
    showToast(res.error || 'PIN Incorrecto', 'error');
  }
};

window.logoutAdmin = function() {
  state.isAdmin = false;
  window.apiService.setAdminState(false);
  updateAdminUI();
  document.getElementById('admin-login-dialog').close();
  showToast('Sesión de administrador cerrada', 'info');
  renderSongGrid();
  if (state.currentSong) renderSongDetail();
};

// ==================== EDITOR DE CANCIÓN (MODAL) ====================
window.openSongEditorModal = function(songId = null) {
  const dialog = document.getElementById('song-editor-dialog');
  const form = document.getElementById('song-editor-form');
  const titleInput = document.getElementById('editor-song-title');
  const artistInput = document.getElementById('editor-song-artist');
  const keyInput = document.getElementById('editor-song-key');
  const tempoInput = document.getElementById('editor-song-tempo');
  const timeSigInput = document.getElementById('editor-song-time');
  const tagsInput = document.getElementById('editor-song-tags');
  const contentInput = document.getElementById('editor-song-content');
  const previewDiv = document.getElementById('editor-live-preview');
  const idInput = document.getElementById('editor-song-id');

  if (!dialog) return;

  if (songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    idInput.value = song.id;
    titleInput.value = song.title;
    artistInput.value = song.artist || '';
    keyInput.value = song.key || 'C';
    tempoInput.value = song.tempo || 120;
    timeSigInput.value = song.timeSignature || '4/4';
    tagsInput.value = (song.tags || []).join(', ');
    contentInput.value = song.content || '';
    document.getElementById('editor-modal-title').textContent = 'Editar Canción';
  } else {
    form.reset();
    idInput.value = '';
    keyInput.value = 'G';
    tempoInput.value = 120;
    timeSigInput.value = '4/4';
    document.getElementById('editor-modal-title').textContent = 'Agregar Nueva Canción';
  }

  const updatePreview = () => {
    previewDiv.innerHTML = window.ChordEngine.renderSongHTML(contentInput.value, 0, keyInput.value);
  };

  contentInput.oninput = updatePreview;
  keyInput.onchange = updatePreview;
  updatePreview();

  dialog.showModal();
};

window.insertChordToEditor = function(tag) {
  const textarea = document.getElementById('editor-song-content');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + tag + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + tag.length;
  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
};

window.saveSongFromEditor = async function(e) {
  e.preventDefault();
  const id = document.getElementById('editor-song-id').value;
  const songData = {
    title: document.getElementById('editor-song-title').value.trim(),
    artist: document.getElementById('editor-song-artist').value.trim(),
    key: document.getElementById('editor-song-key').value,
    tempo: parseInt(document.getElementById('editor-song-tempo').value, 10) || 120,
    timeSignature: document.getElementById('editor-song-time').value.trim() || '4/4',
    tags: document.getElementById('editor-song-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    content: document.getElementById('editor-song-content').value
  };

  try {
    if (id) {
      await window.apiService.updateSong(id, songData);
      showToast('✓ ¡Canción actualizada y publicada a todos!', 'success');
    } else {
      await window.apiService.createSong(songData);
      showToast('✓ ¡Canción agregada y publicada a todos!', 'success');
    }
    document.getElementById('song-editor-dialog').close();
    await loadSongs();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteCurrentSong = async function() {
  if (!state.currentSong) return;
  if (!confirm(`¿Estás seguro de que deseas eliminar "${state.currentSong.title}" de la base de datos en la nube?`)) return;

  try {
    await window.apiService.deleteSong(state.currentSong.id);
    showToast('Canción eliminada del catálogo', 'info');
    await loadSongs();
    switchView('songs');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==================== MODAL DIAGRAMA DE ACORDE ====================
window.openChordDiagramModal = function(chordName) {
  const dialog = document.getElementById('chord-diagram-dialog');
  const container = document.getElementById('chord-diagram-display');
  if (!dialog || !container) return;

  container.innerHTML = window.ChordEngine.generateChordSvg(chordName);
  dialog.showModal();
};

// ==================== MODAL CÓDIGO QR / COMPARTIR ====================
window.openQrShareModal = async function() {
  const dialog = document.getElementById('qr-share-dialog');
  const imgEl = document.getElementById('qr-code-image');
  const urlEl = document.getElementById('qr-url-text');
  if (!dialog) return;

  dialog.showModal();

  const netInfo = await window.apiService.getNetworkInfo();
  if (imgEl && netInfo.qrDataUrl) {
    imgEl.src = netInfo.qrDataUrl;
  }
  if (urlEl) {
    urlEl.textContent = netInfo.fullUrl;
    urlEl.href = netInfo.fullUrl;
  }
};

// ==================== MODAL CONFIGURACIÓN NUBE RENDER.COM ====================
window.openCloudConfigModal = function() {
  const dialog = document.getElementById('render-cloud-dialog');
  const input = document.getElementById('cloud-url-input');
  const feedback = document.getElementById('cloud-test-feedback');
  if (!dialog) return;

  if (input) {
    input.value = window.apiService.getCloudUrl();
  }
  if (feedback) {
    feedback.className = 'hidden';
  }

  dialog.showModal();
};

window.testAndSaveCloudUrl = async function() {
  const input = document.getElementById('cloud-url-input');
  const feedback = document.getElementById('cloud-test-feedback');
  const url = input.value.trim();

  if (feedback) {
    feedback.className = 'text-xs font-semibold p-2.5 rounded-lg mb-3 bg-blue-900/40 text-blue-300 block';
    feedback.textContent = 'Probando conexión con el servidor en la nube...';
  }

  const result = await window.apiService.testConnection(url);
  if (result.success) {
    window.apiService.setCloudUrl(url);
    if (feedback) {
      feedback.className = 'text-xs font-semibold p-2.5 rounded-lg mb-3 bg-emerald-900/40 text-emerald-300 block';
      feedback.textContent = `✓ ¡Conectado exitosamente! Versión: ${result.data?.version || 1}, Canciones: ${result.data?.songCount || 0}`;
    }
    showToast('¡Servidor en la nube guardado con éxito!', 'success');
    await loadSongs();
    await loadSetlists();
  } else {
    if (feedback) {
      feedback.className = 'text-xs font-semibold p-2.5 rounded-lg mb-3 bg-rose-900/40 text-rose-300 block';
      feedback.textContent = `✕ Error al conectar: ${result.error}. Verifica que el servicio esté activo en Render.`;
    }
  }
};

window.resetToLocalServer = function() {
  window.apiService.setCloudUrl('');
  const input = document.getElementById('cloud-url-input');
  const feedback = document.getElementById('cloud-test-feedback');
  if (input) input.value = '';
  if (feedback) {
    feedback.className = 'text-xs font-semibold p-2.5 rounded-lg mb-3 bg-slate-800 text-slate-300 block';
    feedback.textContent = 'Restablecido al servidor local por defecto.';
  }
  showToast('Restablecido a servidor local', 'info');
  loadSongs();
  loadSetlists();
};

// ==================== MODAL EDITOR DE REPERTORIOS ====================
window.openSetlistEditorModal = function() {
  const dialog = document.getElementById('setlist-editor-dialog');
  if (!dialog) return;

  const selector = document.getElementById('setlist-songs-selector');
  if (selector) {
    selector.innerHTML = state.songs.map(song => `
      <label class="flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
        <input type="checkbox" name="setlist-songs" value="${song.id}" class="accent-amber-500 rounded">
        <span class="text-sm font-semibold">${escapeHtml(song.title)}</span>
        <span class="text-xs text-slate-400">(${song.key || 'C'})</span>
      </label>
    `).join('');
  }

  dialog.showModal();
};

window.saveSetlistFromEditor = async function(e) {
  e.preventDefault();
  const name = document.getElementById('editor-setlist-name').value.trim();
  const description = document.getElementById('editor-setlist-desc').value.trim();
  const checked = Array.from(document.querySelectorAll('input[name="setlist-songs"]:checked')).map(cb => cb.value);

  try {
    await window.apiService.saveSetlist({
      name,
      description,
      songIds: checked
    });
    showToast('✓ ¡Repertorio creado exitosamente!', 'success');
    document.getElementById('setlist-editor-dialog').close();
    await loadSetlists();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==================== UTILIDADES ====================
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) {
        window.location.hash = view === 'songs' ? '' : view;
        switchView(view);
      }
    });
  });
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('connection-status-toast');
  if (!toast) return;

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-cyan-600'
  };

  toast.textContent = message;
  toast.className = `status-toast ${bgColors[type] || 'bg-slate-700'} text-white visible`;

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Exportar funciones globales a window para el DOM
window.switchView = switchView;
window.openSongById = openSongById;
window.openSetlistById = openSetlistById;
window.openSongFromSetlist = openSongFromSetlist;
window.state = state;
