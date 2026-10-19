/**
 * ChordMaster Live - Chord Parsing, Transposition & Guitar Diagrams Engine
 */

const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm'];

// Map note names to semitone index (0 to 11)
const NOTE_TO_INDEX = {
  'C': 0, 'B#': 0,
  'C#': 1, 'DB': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'EB': 3, 'Eb': 3,
  'E': 4, 'FB': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'GB': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'AB': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'BB': 10, 'Bb': 10,
  'B': 11, 'CB': 11, 'Cb': 11
};

// Section headers detector
const SECTION_REGEX = /^\s*\[(Verse|Chorus|Intro|Outro|Bridge|Pre-Chorus|Solo|Interlude|Tag|Ending|Instrumental)[^\]]*\]\s*$/i;

// Regex to capture root note, optional quality, and optional slash bass
const CHORD_REGEX = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/;

/**
 * Transpose a single note name by semitones
 */
function transposeNote(note, semitones, preferFlats = false) {
  if (!note || NOTE_TO_INDEX[note] === undefined) return note;
  let idx = (NOTE_TO_INDEX[note] + semitones) % 12;
  if (idx < 0) idx += 12;
  return preferFlats ? FLAT_SCALE[idx] : SHARP_SCALE[idx];
}

/**
 * Transpose a full chord string (e.g. 'G', 'F#m7', 'D/F#')
 */
function transposeChord(chordStr, semitones, preferFlats = false) {
  if (!chordStr) return chordStr;
  const match = chordStr.trim().match(CHORD_REGEX);
  if (!match) return chordStr;

  const root = match[1];
  const quality = match[2] || '';
  const bass = match[3];

  const newRoot = transposeNote(root, semitones, preferFlats);
  if (bass) {
    const newBass = transposeNote(bass, semitones, preferFlats);
    return `${newRoot}${quality}/${newBass}`;
  }
  return `${newRoot}${quality}`;
}

/**
 * Parses song content (ChordPro or 2-line chord/lyric) and returns an HTML-ready rendering
 */
function renderSongHTML(content, semitones = 0, currentKey = 'C') {
  if (!content) return '<p class="text-slate-400 italic">No lyrics or chords provided.</p>';

  const preferFlats = FLAT_KEYS.includes(currentKey);
  const rawLines = content.split('\n');
  const renderedLines = [];

  // Check if content is primarily 2-line chords/lyrics format
  const isTwoLineFormat = checkIfTwoLineFormat(rawLines);
  const normalizedLines = isTwoLineFormat ? convertTwoLineToChordPro(rawLines) : rawLines;

  for (let i = 0; i < normalizedLines.length; i++) {
    const line = normalizedLines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      renderedLines.push('<div class="chord-line-break"></div>');
      continue;
    }

    // Section Header (e.g., [Verse 1], [Chorus])
    const sectionMatch = trimmed.match(SECTION_REGEX);
    if (sectionMatch) {
      const sectionName = trimmed.replace(/^\[|\]$/g, '');
      renderedLines.push(`<div class="section-badge">${escapeHtml(sectionName)}</div>`);
      continue;
    }

    // Process ChordPro line with [Chord] embedded
    if (line.includes('[') && line.includes(']')) {
      const parts = splitChordProLine(line);
      let lineHtml = '<div class="chord-lyric-row">';
      let hasChords = false;

      parts.forEach(part => {
        const chord = part.chord ? transposeChord(part.chord, semitones, preferFlats) : '';
        const text = part.text || '';
        if (chord) hasChords = true;

        lineHtml += `
          <span class="chord-pair">
            ${chord ? `<span class="chord-token" data-chord="${escapeHtml(chord)}">${escapeHtml(chord)}</span>` : '<span class="chord-spacer">&nbsp;</span>'}
            <span class="lyric-token">${escapeHtml(text) || '&nbsp;'}</span>
          </span>
        `;
      });

      lineHtml += '</div>';
      renderedLines.push(lineHtml);
    } else {
      // Plain lyric line
      renderedLines.push(`
        <div class="chord-lyric-row">
          <span class="chord-pair">
            <span class="chord-spacer">&nbsp;</span>
            <span class="lyric-token">${escapeHtml(line)}</span>
          </span>
        </div>
      `);
    }
  }

  return renderedLines.join('');
}

/**
 * Splits a single ChordPro line into chord & text segments
 * e.g. "[G]Amazing [D]grace" -> [{chord: 'G', text: 'Amazing '}, {chord: 'D', text: 'grace'}]
 */
function splitChordProLine(line) {
  const parts = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let match;
  let lastIndex = 0;

  // Check if there is initial text before the first chord
  const firstBracket = line.indexOf('[');
  if (firstBracket > 0) {
    parts.push({
      chord: null,
      text: line.substring(0, firstBracket)
    });
  }

  while ((match = regex.exec(line)) !== null) {
    parts.push({
      chord: match[1],
      text: match[2]
    });
    lastIndex = regex.lastIndex;
  }

  // Trailing text if any
  if (lastIndex < line.length && firstBracket === -1) {
    parts.push({
      chord: null,
      text: line.substring(lastIndex)
    });
  }

  return parts.length ? parts : [{ chord: null, text: line }];
}

/**
 * Check if the text is 2-line format: chord line followed by lyric line
 */
function checkIfTwoLineFormat(lines) {
  let chordLineCount = 0;
  for (const line of lines) {
    if (isStrictChordLine(line)) {
      chordLineCount++;
    }
  }
  return chordLineCount >= 2;
}

/**
 * Checks if a single string contains solely recognized chord symbols
 */
function isStrictChordLine(line) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  let matches = 0;
  for (const word of words) {
    if (CHORD_REGEX.test(word)) matches++;
  }
  return matches / words.length >= 0.75;
}

/**
 * Converts traditional two-line chords/lyrics to ChordPro string format
 */
function convertTwoLineToChordPro(lines) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const current = lines[i];
    const next = lines[i + 1];

    if (isStrictChordLine(current) && next && !isStrictChordLine(next) && !SECTION_REGEX.test(next)) {
      // Merge current chord line into next lyric line
      result.push(mergeChordsAndLyrics(current, next));
      i += 2;
    } else {
      result.push(current);
      i++;
    }
  }
  return result;
}

/**
 * Merges a chord line with character-aligned lyrics into ChordPro format
 */
function mergeChordsAndLyrics(chordLine, lyricLine) {
  let chordPositions = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(chordLine)) !== null) {
    chordPositions.push({ chord: match[0], index: match.index });
  }

  if (chordPositions.length === 0) return lyricLine;

  let merged = '';
  let lyricIdx = 0;

  for (const item of chordPositions) {
    if (item.index > lyricIdx) {
      merged += lyricLine.substring(lyricIdx, Math.min(item.index, lyricLine.length));
      lyricIdx = item.index;
    }
    merged += `[${item.chord}]`;
  }

  if (lyricIdx < lyricLine.length) {
    merged += lyricLine.substring(lyricIdx);
  }

  return merged;
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

// ==================== GUITAR CHORD DIAGRAMS ====================

// Standard 6-string guitar fingering library: [string6(E), 5(A), 4(D), 3(G), 2(B), 1(E)]
// -1 = mute (x), 0 = open, 1..n = fret number
const GUITAR_CHORDS = {
  'C':    [-1, 3, 2, 0, 1, 0],
  'C7':   [-1, 3, 2, 3, 1, 0],
  'Cmaj7':[-1, 3, 2, 0, 0, 0],
  'Cm':   [-1, 3, 5, 5, 4, 3],
  'D':    [-1, -1, 0, 2, 3, 2],
  'D7':   [-1, -1, 0, 2, 1, 2],
  'Dm':   [-1, -1, 0, 2, 3, 1],
  'Dmaj7':[-1, -1, 0, 2, 2, 2],
  'D/F#': [2, 0, 0, 2, 3, 2],
  'E':    [0, 2, 2, 1, 0, 0],
  'Em':   [0, 2, 2, 0, 0, 0],
  'E7':   [0, 2, 0, 1, 0, 0],
  'F':    [1, 3, 3, 2, 1, 1],
  'Fm':   [1, 3, 3, 1, 1, 1],
  'F#':   [2, 4, 4, 3, 2, 2],
  'F#m':  [2, 4, 4, 2, 2, 2],
  'G':    [3, 2, 0, 0, 0, 3],
  'G7':   [3, 2, 0, 0, 0, 1],
  'Gm':   [3, 5, 5, 3, 3, 3],
  'G/B':  [-1, 2, 0, 0, 3, 3],
  'A':    [-1, 0, 2, 2, 2, 0],
  'Am':   [-1, 0, 2, 2, 1, 0],
  'A7':   [-1, 0, 2, 0, 2, 0],
  'Amaj7':[-1, 0, 2, 1, 2, 0],
  'B':    [-1, 2, 4, 4, 4, 2],
  'Bm':   [-1, 2, 4, 4, 3, 2],
  'B7':   [-1, 2, 1, 2, 0, 2],
  'Bb':   [-1, 1, 3, 3, 3, 1],
  'Bbm':  [-1, 1, 3, 3, 2, 1],
  'C#m':  [-1, 4, 6, 6, 5, 4],
  'Ab':   [4, 6, 6, 5, 4, 4],
  'Eb':   [-1, 6, 8, 8, 8, 6]
};

/**
 * Generate an SVG diagram for a given guitar chord
 */
function generateChordSvg(chordName) {
  // Normalize simple chord variations
  let cleanName = chordName.replace(/\[|\]/g, '').trim();
  let pattern = GUITAR_CHORDS[cleanName];

  // Try fallback to root major/minor if specific extension not found
  if (!pattern) {
    const rootMatch = cleanName.match(/^([A-G][#b]?)(m?)/);
    if (rootMatch) {
      const basic = rootMatch[1] + rootMatch[2];
      pattern = GUITAR_CHORDS[basic];
    }
  }

  if (!pattern) {
    return `<div class="p-4 text-center text-sm text-slate-400">Diagram for <strong>${escapeHtml(cleanName)}</strong> available in manual voicing.</div>`;
  }

  const width = 160;
  const height = 190;
  const startX = 35;
  const startY = 40;
  const stringSpacing = 18;
  const fretSpacing = 26;
  const numFrets = 4;
  const numStrings = 6;

  // Find lowest fret > 0 to handle barred/high frets
  const positiveFrets = pattern.filter(f => f > 0);
  const minFret = positiveFrets.length ? Math.min(...positiveFrets) : 1;
  const baseFret = minFret > 2 ? minFret : 1;

  let svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="chord-diagram-svg">
      <!-- Chord Name Title -->
      <text x="${width / 2}" y="24" text-anchor="middle" font-size="18" font-weight="bold" fill="#f59e0b">${escapeHtml(cleanName)}</text>
  `;

  // Draw Nut or Base Fret Marker
  if (baseFret === 1) {
    svg += `<rect x="${startX}" y="${startY - 4}" width="${stringSpacing * 5}" height="5" fill="#f8fafc" rx="1" />`;
  } else {
    svg += `<text x="${startX - 18}" y="${startY + 18}" font-size="12" fill="#94a3b8" font-weight="600">${baseFret}fr</text>`;
  }

  // Draw Frets (horizontal lines)
  for (let f = 0; f <= numFrets; f++) {
    const y = startY + f * fretSpacing;
    svg += `<line x1="${startX}" y1="${y}" x2="${startX + stringSpacing * 5}" y2="${y}" stroke="#475569" stroke-width="2" />`;
  }

  // Draw Strings (vertical lines)
  for (let s = 0; s < numStrings; s++) {
    const x = startX + s * stringSpacing;
    svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + numFrets * fretSpacing}" stroke="#94a3b8" stroke-width="${1 + (5 - s) * 0.3}" />`;
  }

  // Draw Markers (x, o, finger dots)
  pattern.forEach((fret, stringIdx) => {
    const x = startX + stringIdx * stringSpacing;

    if (fret === -1) {
      // Mute (x)
      svg += `<text x="${x}" y="${startY - 10}" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">×</text>`;
    } else if (fret === 0) {
      // Open (o)
      svg += `<circle cx="${x}" cy="${startY - 13}" r="4.5" fill="none" stroke="#38bdf8" stroke-width="2" />`;
    } else {
      // Finger dot
      const displayFret = fret - baseFret + 1;
      if (displayFret >= 1 && displayFret <= numFrets) {
        const y = startY + (displayFret - 0.5) * fretSpacing;
        svg += `
          <circle cx="${x}" cy="${y}" r="6.5" fill="#38bdf8" />
          <circle cx="${x}" cy="${y}" r="8.5" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
        `;
      }
    }
  });

  svg += `</svg>`;
  return svg;
}

// Export for browser
window.ChordEngine = {
  transposeNote,
  transposeChord,
  renderSongHTML,
  generateChordSvg,
  SHARP_SCALE,
  FLAT_SCALE,
  NOTE_TO_INDEX
};
