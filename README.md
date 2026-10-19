# 🎸 ChordMaster Live

> **A real-time, cloud-synced Android Mobile & Web App for musicians, bands, and worship teams.**  
> View chords with lyrics, transpose keys on the fly, auto-scroll hands-free, create setlists, attach personal musician notes, and manage a shared cloud songbook with Admin controls.

---

## 🌟 Key Features

### 1. Chords with Lyrics Sheet Viewer
- **Smart Transposition**: Shift semitones up (`+1`) or down (`-1`), change to any key with automatic sharps (`#`) and flats (`b`) adaptation.
- **Capo Calculator**: Instantly calculates capo fret positions and tells you which chord shapes to play.
- **Hands-Free Auto-Scroll**: Floating controller with smooth scrolling, play/pause button, and adjustable speed slider (`0.5x` to `4.0x`).
- **Interactive Guitar Diagrams**: Tap on any chord token (e.g., `[G]`, `[Em]`, `[D/F#]`) to open an SVG guitar fretboard diagram showing strings, frets, and finger dots!
- **Font Size Scaler**: Quick `A-` and `A+` controls to scale sheet fonts for readability on music stands.
- **Metronome & Tap Tempo**: Built-in Web Audio metronome with audio click and visual pulse.

### 2. Complete Song Metadata
- **Song Name & Author/Artist**
- **Original Key** (C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B, Am, Em, etc.)
- **Tempo (BPM)** and **Time Signature** (4/4, 3/4, 6/8, etc.)
- **Tags & Genre** (Worship, Acoustic, Rock, Latin, Pop, etc.)

### 3. Setlists & Live Stage Mode
- Create custom setlists (e.g., *"Sunday Worship 10am"*, *"Friday Acoustic Gig"*).
- Add songs from the catalog, reorder songs (`▲` / `▼`), and manage setlists.
- **⚡ Live Stage Performance Mode**:
  - Full-screen distraction-free view with large buttons (`◀ Prev`, `Next ▶`).
  - **Touch Swipe Gestures**: Swipe left or right on mobile to transition between songs seamlessly without touching menus.
  - Remembers individual song transposition and settings.

### 4. General View & Instant Search Bar
- Unified song library catalog.
- **Instant Search**: Type to filter simultaneously by Title, Artist, Key, or Lyrics!
- **Filter Chips**: Filter by Key (`Key of G`, `Key of C`), or sort by Title (A-Z), Artist, Key, or Recently Added.

### 5. Independent Musician Notes (Personal & Band)
- **📝 My Personal Notes (Local to Phone)**: Every band member (guitarist, drummer, singer, bassist) can write their own independent cues (e.g., *"Capo 3"*, *"Guitar solo after chorus 2"*, *"Vocal harmony on line 3"*). Notes auto-save directly to their device.
- **👥 Band Notes (Cloud Synced)**: Admin-curated cues synced across all devices (e.g., *"End abruptly on beat 4"*).

### 6. Admin Management & Instant Online Sync
- **In-App Admin Mode**: Tap "Admin" in the top bar or bottom navigation and enter your PIN (Default: `1234`).
- **Song Editor Studio**:
  - Add or edit songs with live ChordPro insertion shortcuts (`[G]`, `[C]`, `[Verse]`, `[Chorus]`).
  - **Live Split-Screen Preview**: Watch the chord sheet render in real time as you type!
- **Instant Broadcast**: When the Admin adds or modifies a song from their PC or phone, all connected Android devices detect the new database version and refresh their catalog automatically!
- **Offline Stage Mode**: Service Worker and `localStorage` cache the entire catalog and setlists. If internet drops at a rehearsal or venue, the app continues working 100% offline!

---

## 🚀 How to Run Locally

The server is already installed and running at:
- **PC Browser**: [http://localhost:3000](http://localhost:3000)
- **Mobile Wi-Fi**: Check your local IP printed in the terminal (e.g. `http://192.168.x.x:3000`)

To start or restart the server manually:
```powershell
cd C:\Users\Erk320\.gemini\antigravity\scratch\chordmaster-app
.\start.bat
# or: node server.js
```

---

## 📱 How to Open & Install on Android Phones

### Method 1: Instant Wi-Fi QR Code (Zero Setup)
1. Open [http://localhost:3000](http://localhost:3000) on your PC.
2. Tap the **"Connect Phone"** button in the top navigation bar.
3. A large QR Code will pop up.
4. Point your Android phone's camera at the QR code and tap the link to open.
5. In Chrome on Android, tap the **"Install App"** banner at the top (or tap the 3 dots ⋮ -> *"Add to Home Screen"*).
6. **ChordMaster Live** installs directly to your Android app drawer and home screen with a native icon, full-screen view (no browser address bar), and offline support!

---

## 🌐 How to Host Online for Free (Global Band Sharing)

To share the app with friends, band members, or church teams anywhere in the world across cellular data (4G/5G) and home Wi-Fi:

### Free 1-Click Deployment with Render.com:
1. Push this folder to a GitHub repository (e.g., `github.com/your-username/chordmaster-live`).
2. Go to [https://render.com](https://render.com) (free account).
3. Click **New +** -> **Web Service** -> connect your repository.
4. Render will detect the included `render.yaml` or settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variable**: `ADMIN_PIN = your_secure_pin`
5. Click **Create Web Service**. Within 2 minutes, Render gives you a live global URL:  
   `https://chordmaster-live.onrender.com`
6. Share this link with your band! Anyone who opens it can install it on their Android phone. Any song you add as Admin from your PC or phone will be reflected to everyone!

*(Also compatible with Railway, Fly.io, Heroku, Docker, and standard VPS servers).*

---

## 📦 Native Android APK Compilation (Optional)

If you need a standalone `.apk` installer file:
1. This project is pre-configured with `capacitor.config.json`.
2. Run:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npx cap copy
   npx cap open android
   ```
3. Android Studio will open, where you can click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** to generate `app-debug.apk` or `app-release.apk`!

---

## 🔐 Default Admin PIN
- Default PIN: `1234`
- To customize, set the environment variable `ADMIN_PIN=my_new_pin` or edit `database/db.js`.
