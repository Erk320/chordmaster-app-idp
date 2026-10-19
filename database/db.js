const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');
const BACKUP_FILE = path.join(__dirname, 'data.backup.json');

// Canciones iniciales en español con acordes y secciones completas
const STARTER_SONGS = [
  {
    id: "song-1",
    title: "De Música Ligera",
    artist: "Soda Stereo",
    key: "Bm",
    tempo: 126,
    timeSignature: "4/4",
    tags: ["Rock", "Latino", "Clásico"],
    notes: "Riff principal: Bm - G - D - A. Batería entra con fuerza en los coros.",
    content: `[Intro]
[Bm]   [G]   [D]   [A]  (x4)

[Verso 1]
[Bm]Ella durmió [G]al calor de las [D]masas [A]
[Bm]Y yo desperté [G]queriendo so-[D]ñarla [A]
[Bm]Algún tiempo atrás [G]pensé en escri-[D]birle [A]
[Bm]Que nunca sorteé [G]las trampas del [D]amor [A]

[Coro]
De a-[Bm]quel amor [G]
De [D]música li-[A]gera
Nada [Bm]nos libra [G]
Nada [D]más que-[A]da

[Verso 2]
[Bm]No le enviaré [G]cenizas de [D]rosas [A]
[Bm]Ni pienso evitar [G]un roce se-[D]creto [A]

[Coro]
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
    id: "song-2",
    title: "Cuán Grande Es Dios",
    artist: "En Espiritu y En Verdad",
    key: "G",
    tempo: 76,
    timeSignature: "4/4",
    tags: ["Adoración", "Acústico", "Alabanza"],
    notes: "Pad suave en verso 1. Subir intensidad en el puente y coro final.",
    content: `[Intro]
[G]    [Em7]    [C2]    [D]

[Verso 1]
El [G]esplendor de un Rey, vestido en [Em7]majestad
La tierra alegre [C2]está, la tierra alegre está
Se [G]cubre de su luz, las sombras [Em7]huyen ya
Y tiemblan a su [C2]voz, y tiemblan a su voz

[Coro]
Cuán [G]grande es Dios, cántale
Cuán [Em7]grande es Dios, y todos lo verán
Cuán [C2]grande, cuán [D]grande es [G]Dios

[Verso 2]
Con [G]fuerza y edad, sus años [Em7]durarán
Principio y el [C2]fin, principio y el fin
La [G]Trinidad en Dios, el Padre, [Em7]Hijo, Espíritu
Cordero y el [C2]León, Cordero y el León

[Coro]
Cuán [G]grande es Dios, cántale
Cuán [Em7]grande es Dios, y todos lo verán
Cuán [C2]grande, cuán [D]grande es [G]Dios

[Puente]
Tu [G]nombre sobre todo es
Eres [Em7]digno de alabar
Y mi [C2]ser dirá: Cuán [D]grande es [G]Dios`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-3",
    title: "Flaca",
    artist: "Andrés Calamaro",
    key: "G",
    tempo: 114,
    timeSignature: "4/4",
    tags: ["Pop", "Rock", "Acústico"],
    notes: "Progresión: G - B7 - Em - C - G - D - G - D. Guitarra acústica con rasgueo constante.",
    content: `[Intro]
[G]   [B7]   [Em]   [C]   [G]   [D]   [G]   [D]

[Verso 1]
[G]Flaca, no me [B7]claves tus puñales
Por la [Em]espalda, tan pro-[C]fundo
No me [G]duelen, no me [D]hacen más daño, [G]no [D]
[G]El día en el que [B7]te vayas
Me voy a [Em]emborrachar al [C]bar
Y voy a bus-[G]carme una que se [D]parezca a [G]ti [D]

[Coro]
[G]Aunque casi [B7]te confieso que también
He [Em]sido un perro com-[C]pañero
Un [G]perro fiel que [D]dormía a tus [G]pies [D]

[Verso 2]
[G]Flaca, no me [B7]claves tus puñales
Por la [Em]espalda, tan pro-[C]fundo
No me [G]duelen, no me [D]hacen más daño, [G]no [D]`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-4",
    title: "Eres Todopoderoso",
    artist: "Danilo Montero",
    key: "Bm",
    tempo: 130,
    timeSignature: "4/4",
    tags: ["Alabanza", "Latino", "Júbilo"],
    notes: "Ritmo rápido y alegre. Bm - G - D - A. Bajo marcando octavas.",
    content: `[Intro]
[Bm]   [G]   [D]   [A] (x2)

[Verso 1]
La [Bm]única razón de mi [G]adoración
Eres [D]Tú mi Jesús [A]
El [Bm]único motivo para [G]vivir
Eres [D]Tú mi Señor [A]

[Verso 2]
Mi [Bm]única verdad está [G]en Ti
Eres mi luz y mi [D]salvación [A]
Mi [Bm]único amor eres [G]Tú Señor
Y por [D]siempre te alabaré [A]

[Coro]
Tú eres [Bm]todopoderoso
Eres [G]grande y majestuoso
Eres [D]fuerte, invencible
Y no [A]hay nadie como Tú`,
    updatedAt: new Date().toISOString()
  },
  {
    id: "song-5",
    title: "La Bamba",
    artist: "Los Lobos / Ritchie Valens",
    key: "C",
    tempo: 152,
    timeSignature: "4/4",
    tags: ["Rock & Roll", "Latino", "Fiesta"],
    notes: "Progresión clásica de 3 acordes: C - F - G. Solo de guitarra en la escala de Do.",
    content: `[Intro]
[C]   [F]   [G]   (x4)

[Verso 1]
Para bailar la [C]bamba [F]  [G]
Para bailar la [C]bamba se nece-[F]sita una poca de [G]gracia
Una poca de [C]gracia pa' mí, pa' [F]ti, ay arriba y a-[G]rriba
Ay arriba y a-[C]rriba, por ti se-[F]ré, por ti se-[G]ré, por ti seré

[Coro]
Yo no soy ma-[C]rinero [F]  [G]
Yo no soy ma-[C]rinero, soy capi-[F]tán, soy capi-[G]tán
Soy capi-[C]tán! [F]  [G]
Bamba, [C]bamba, [F]  [G]
Bamba, [C]bamba, [F]  [G]`,
    updatedAt: new Date().toISOString()
  }
];

const STARTER_SETLISTS = [
  {
    id: "setlist-1",
    name: "Servicio Domingo / Ensayo en Vivo",
    description: "Repertorio principal para la banda completa",
    songIds: ["song-2", "song-4", "song-1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "setlist-2",
    name: "Noche Acústica & Concierto",
    description: "Set acústico con guitarras y percusión suave",
    songIds: ["song-3", "song-1", "song-5"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class Database {
  constructor() {
    this.data = {
      version: 1,
      lastModified: new Date().toISOString(),
      adminPin: "1234",
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
      console.error('Error al cargar la base de datos, reiniciando valores iniciales:', err);
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
      fs.writeFileSync(BACKUP_FILE, content, 'utf-8');
      return true;
    } catch (err) {
      console.error('Fallo al guardar archivo de base de datos:', err);
      return false;
    }
  }

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
      id,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.songs[idx];
  }

  deleteSong(id) {
    const prevLen = this.data.songs.length;
    this.data.songs = this.data.songs.filter(s => s.id !== id);
    this.data.setlists.forEach(setlist => {
      setlist.songIds = setlist.songIds.filter(sId => sId !== id);
    });
    this.save();
    return this.data.songs.length < prevLen;
  }

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
