const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');
const BACKUP_FILE = path.join(__dirname, 'data.backup.json');

// Initial starter songs with rich chords, metadata, and sections
const STARTER_SONGS = [
  {
    id: "song-1",
    title: "Amazing Grace",
    artist: "John Newton",
    key: "G",
    tempo: 75,
    timeSignature: "3/4",
    tags: ["Hymn", "Acoustic", "Traditional"],
    notes: "Acoustic fingerpicking intro. Build dynamics in verse 3.",
    content: `[Verse 1]
[G]Amazing grace, how [C]sweet the [G]sound
That saved a wretch like [D]me
I [G]once was lost, but [C]now am [G]found
Was blind, but [D]now I [G]see

[Verse 2]
'Twas [G]grace that taught my [C]heart to [G]fear
And grace my fears [D]relieved
How [G]precious did that [C]grace [G]appear
The hour I [D]first [G]believed

[Chorus]
My [C]chains are gone, I've been [G]set free
My [C]God, my Savior has [G]ransomed [D]me
And [C]like a flood, His [G]mercy [Em]reigns
Un-[Am]ending love, a-[D]mazing [G]grace

[Verse 3]
The [G]Lord has promised [C]good to [G]me
His word my hope [D]secures
He [G]will my shield and [C]portion [G]be
As long as [D]life [G]endures`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-2",
    title: "Stand By Me",
    artist: "Ben E. King",
    key: "A",
    tempo: 118,
    timeSignature: "4/4",
    tags: ["Soul", "Classic", "Pop"],
    notes: "Bass line: A - F#m - D - E. Electric guitar light palm muting.",
    content: `[Intro]
[A]    [F#m]    [D]   [E]   [A]

[Verse 1]
When the [A]night has come
And the [F#m]land is dark
And the [D]moon is the [E]only light we'll [A]see
No, I [A]won't be afraid
Oh, I [F#m]won't be afraid
Just as [D]long as you [E]stand, stand by [A]me

[Chorus]
So darling, darling, [A]stand by me
Oh, [F#m]stand by me
Oh, [D]stand, [E]stand by me, [A]stand by me

[Verse 2]
If the [A]sky that we look upon
[F#m]Should tumble and fall
Or the [D]mountain should [E]crumble to the [A]sea
I won't [A]cry, I won't cry
No, I [F#m]won't shed a tear
Just as [D]long as you [E]stand, stand by [A]me

[Chorus]
And darling, darling, [A]stand by me
Oh, [F#m]stand by me
Oh, [D]stand, [E]stand by me, [A]stand by me`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-3",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    key: "C",
    tempo: 56,
    timeSignature: "6/8",
    tags: ["Acoustic", "Ballad", "Folk"],
    notes: "Arpeggiate chords smoothly: 1-2-3-4-5-6 in 6/8 time.",
    content: `[Intro]
[C]   [Am]   [C]   [Am]

[Verse 1]
I've [C]heard there was a [Am]secret chord
That [C]David played, and it [Am]pleased the Lord
But [F]you don't really [G]care for music, [C]do you? [G]
It [C]goes like this, the [F]fourth, the [G]fifth
The [Am]minor fall, the [F]major lift
The [G]baffled king com-[E7]posing Halle-[Am]lujah

[Chorus]
Halle-[F]lujah, Halle-[Am]lujah
Halle-[F]lujah, Halle-[C]lu---[G]--[C]jah

[Verse 2]
Your [C]faith was strong but you [Am]needed proof
You [C]saw her bathing [Am]on the roof
Her [F]beauty and the [G]moonlight over-[C]threw you [G]
She [C]tied you to a [F]kitchen [G]chair
She [Am]broke your throne, and she [F]cut your hair
And [G]from your lips she [E7]drew the Halle-[Am]lujah

[Chorus]
Halle-[F]lujah, Halle-[Am]lujah
Halle-[F]lujah, Halle-[C]lu---[G]--[C]jah`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-4",
    title: "De Música Ligera",
    artist: "Soda Stereo",
    key: "Bm",
    tempo: 126,
    timeSignature: "4/4",
    tags: ["Rock", "Latin", "Spanish"],
    notes: "Main iconic riff: Bm - G - D - A. Drums drive with heavy hi-hat in choruses.",
    content: `[Intro]
[Bm]   [G]   [D]   [A]  (x4)

[Verse 1]
[Bm]Ella durmió [G]al calor de las [D]masas [A]
[Bm]Y yo desperté [G]queriendo so-[D]ñarla [A]
[Bm]Algún tiempo atrás [G]pensé en escri-[D]birle [A]
[Bm]Que nunca sorteé [G]las trampas del [D]amor [A]

[Chorus]
De a-[Bm]quel amor [G]
De [D]música li-[A]gera
Nada [Bm]nos libra [G]
Nada [D]más que-[A]da

[Verse 2]
[Bm]No le enviaré [G]cenizas de [D]rosas [A]
[Bm]Ni pienso evitar [G]un roce se-[D]creto [A]

[Chorus]
De a-[Bm]quel amor [G]
De [D]música li-[A]gera
Nada [Bm]nos libra [G]
Nada [D]más que-[A]da

[Outro]
[Bm]   [G]   [D]   [A]
¡Nada más queda! ¡Gracias totales!`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-5",
    title: "Way Maker",
    artist: "Sinach",
    key: "E",
    tempo: 68,
    timeSignature: "4/4",
    tags: ["Worship", "Contemporary"],
    notes: "Capo 2 for guitar in D if preferred. Pad and piano start verse 1 soft.",
    content: `[Intro]
[E]   [B]   [C#m]   [A]

[Verse 1]
You are [E]here, moving in our [B]midst
I worship [C#m]You, I worship [A]You
You are [E]here, working in this [B]place
I worship [C#m]You, I worship [A]You

[Chorus]
[E]Way Maker, Miracle Worker, [B]Promise Keeper
Light in the darkness, [C#m]my God, that is who You [A]are
[E]Way Maker, Miracle Worker, [B]Promise Keeper
Light in the darkness, [C#m]my God, that is who You [A]are

[Verse 2]
You are [E]here, touching every [B]heart
I worship [C#m]You, I worship [A]You
You are [E]here, healing every [B]heart
I worship [C#m]You, I worship [A]You`,
    updatedAt: new Date().toISOString()
  }
];

const STARTER_SETLISTS = [
  {
    id: "setlist-1",
    name: "Sunday Rehearsal & Live",
    description: "Main weekend set for full band",
    songIds: ["song-5", "song-1", "song-3"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "setlist-2",
    name: "Acoustic Night",
    description: "Unplugged acoustic set with guitar and vocal",
    songIds: ["song-2", "song-4", "song-1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class Database {
  constructor() {
    this.data = {
      version: 1,
      lastModified: new Date().toISOString(),
      adminPin: "1234", // Default admin PIN, easily changed in UI or env
      songs: [],
      setlists: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure defaults if empty
        if (!this.data.songs || this.data.songs.length === 0) {
          this.data.songs = STARTER_SONGS;
          this.data.setlists = STARTER_SETLISTS;
          this.save();
        }
      } else {
        this.data.songs = STARTER_SONGS;
        this.data.setlists = STARTER_SETLISTS;
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, resetting to starters:', err);
      this.data.songs = STARTER_SONGS;
      this.data.setlists = STARTER_SETLISTS;
      this.save();
    }
  }

  save() {
    try {
      this.data.version = (this.data.version || 0) + 1;
      this.data.lastModified = new Date().toISOString();
      const content = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_FILE, content, 'utf-8');
      // Create backup periodically
      fs.writeFileSync(BACKUP_FILE, content, 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to write database file:', err);
      return false;
    }
  }

  // --- SONGS ---
  getAllSongs() {
    return this.data.songs;
  }

  getSongById(id) {
    return this.data.songs.find(s => s.id === id);
  }

  addSong(songData) {
    const id = songData.id || `song-${Date.now()}`;
    const newSong = {
      ...songData,
      id,
      updatedAt: new Date().toISOString()
    };
    this.data.songs.unshift(newSong);
    this.save();
    return newSong;
  }

  updateSong(id, updates) {
    const idx = this.data.songs.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.songs[idx] = {
      ...this.data.songs[idx],
      ...updates,
      id, // protect id
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.songs[idx];
  }

  deleteSong(id) {
    const prevLen = this.data.songs.length;
    this.data.songs = this.data.songs.filter(s => s.id !== id);
    // Remove from setlists too
    this.data.setlists.forEach(setlist => {
      setlist.songIds = setlist.songIds.filter(sId => sId !== id);
    });
    this.save();
    return this.data.songs.length < prevLen;
  }

  // --- SETLISTS ---
  getAllSetlists() {
    return this.data.setlists;
  }

  getSetlistById(id) {
    return this.data.setlists.find(s => s.id === id);
  }

  addSetlist(setlistData) {
    const id = setlistData.id || `setlist-${Date.now()}`;
    const newSetlist = {
      ...setlistData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.setlists.unshift(newSetlist);
    this.save();
    return newSetlist;
  }

  updateSetlist(id, updates) {
    const idx = this.data.setlists.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.setlists[idx] = {
      ...this.data.setlists[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.setlists[idx];
  }

  deleteSetlist(id) {
    const prevLen = this.data.setlists.length;
    this.data.setlists = this.data.setlists.filter(s => s.id !== id);
    this.save();
    return this.data.setlists.length < prevLen;
  }

  // --- ADMIN & SYNC ---
  verifyAdminPin(pin) {
    const currentPin = process.env.ADMIN_PIN || this.data.adminPin || "1234";
    return String(pin) === String(currentPin);
  }

  setAdminPin(newPin) {
    this.data.adminPin = String(newPin);
    this.save();
    return true;
  }

  getSyncInfo() {
    return {
      version: this.data.version,
      lastModified: this.data.lastModified,
      songCount: this.data.songs.length,
      setlistCount: this.data.setlists.length
    };
  }

  resetToStarters() {
    this.data.songs = STARTER_SONGS;
    this.data.setlists = STARTER_SETLISTS;
    this.save();
    return true;
  }
}

module.exports = new Database();
