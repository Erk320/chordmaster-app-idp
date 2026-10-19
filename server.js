const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper function to find local network IPv4 address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (e.g. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware: Admin verification helper
function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body?.adminPin;
  if (!db.verifyAdminPin(pin)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
  }
  next();
}

// ==================== REST API ====================

// --- Network & QR Code Info for Instant Phone Pairing ---
app.get('/api/network-info', async (req, res) => {
  const localIp = getLocalIpAddress();
  const host = req.get('host') || `${localIp}:${PORT}`;
  const protocol = req.protocol || 'http';
  const fullUrl = `${protocol}://${localIp}:${PORT}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(fullUrl, {
      margin: 1,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    res.json({
      localIp,
      port: PORT,
      fullUrl,
      qrDataUrl
    });
  } catch (err) {
    res.json({ localIp, port: PORT, fullUrl, qrDataUrl: null });
  }
});

// --- Sync Status (Clients poll this to detect updates instantly) ---
app.get('/api/sync/status', (req, res) => {
  res.json(db.getSyncInfo());
});

// --- Admin Verification ---
app.post('/api/admin/verify', (req, res) => {
  const { pin } = req.body;
  if (db.verifyAdminPin(pin)) {
    res.json({ success: true, message: 'Admin verified successfully' });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect PIN' });
  }
});

// --- Songs Endpoints ---
app.get('/api/songs', (req, res) => {
  const songs = db.getAllSongs();
  res.json(songs);
});

app.get('/api/songs/:id', (req, res) => {
  const song = db.getSongById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

app.post('/api/songs', requireAdmin, (req, res) => {
  const { title, artist, key, tempo, timeSignature, tags, notes, content } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Song title is required' });
  }
  const newSong = db.addSong({
    title,
    artist: artist || 'Unknown Artist',
    key: key || 'C',
    tempo: tempo ? parseInt(tempo, 10) : 120,
    timeSignature: timeSignature || '4/4',
    tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : []),
    notes: notes || '',
    content: content || ''
  });
  res.status(201).json(newSong);
});

app.put('/api/songs/:id', requireAdmin, (req, res) => {
  const updated = db.updateSong(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Song not found' });
  res.json(updated);
});

app.delete('/api/songs/:id', requireAdmin, (req, res) => {
  const success = db.deleteSong(req.params.id);
  if (!success) return res.status(404).json({ error: 'Song not found' });
  res.json({ success: true, message: 'Song deleted successfully' });
});

// --- Setlists Endpoints ---
app.get('/api/setlists', (req, res) => {
  const setlists = db.getAllSetlists();
  res.json(setlists);
});

app.get('/api/setlists/:id', (req, res) => {
  const setlist = db.getSetlistById(req.params.id);
  if (!setlist) return res.status(404).json({ error: 'Setlist not found' });
  
  // Attach resolved song objects for convenience
  const allSongs = db.getAllSongs();
  const populatedSongs = (setlist.songIds || [])
    .map(id => allSongs.find(s => s.id === id))
    .filter(Boolean);

  res.json({
    ...setlist,
    songs: populatedSongs
  });
});

app.post('/api/setlists', (req, res) => {
  const { name, description, songIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Setlist name is required' });
  const newSetlist = db.addSetlist({
    name,
    description: description || '',
    songIds: Array.isArray(songIds) ? songIds : []
  });
  res.status(201).json(newSetlist);
});

app.put('/api/setlists/:id', (req, res) => {
  const updated = db.updateSetlist(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Setlist not found' });
  res.json(updated);
});

app.delete('/api/setlists/:id', (req, res) => {
  const success = db.deleteSetlist(req.params.id);
  if (!success) return res.status(404).json({ error: 'Setlist not found' });
  res.json({ success: true, message: 'Setlist deleted successfully' });
});

// --- Bulk Reset ---
app.post('/api/admin/reset-starter', requireAdmin, (req, res) => {
  db.resetToStarters();
  res.json({ success: true, message: 'Database reset to starter songs' });
});

// --- Serve Static Frontend Files ---
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve SPA index.html for navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`\n======================================================`);
  console.log(`🎵 CHORDMASTER LIVE SERVER RUNNING`);
  console.log(`======================================================`);
  console.log(`💻 Local PC Access:    http://localhost:${PORT}`);
  console.log(`📱 Mobile Wi-Fi Access: http://${localIp}:${PORT}`);
  console.log(`🔑 Default Admin PIN:  1234`);
  console.log(`======================================================`);
  console.log(`Point your Android camera or browser to http://${localIp}:${PORT}`);
  console.log(`to install the app directly on your phone!\n`);
});
