# CLAUDE.md

## Project Overview

Build a single-page web application for bass practice using only:

* HTML
* CSS
* JavaScript

No React for the initial MVP.

The application should help a bass player practice scales visually by:

* displaying one scale shape at a time
* showing a bass fretboard
* highlighting notes in sequence
* supporting next / previous shape navigation
* supporting ascending, descending, and ascending+descending playback
* supporting adjustable tempo (slider and keyboard shortcuts)
* metronome click track keeping time with the tempo
* eventually supporting note audio

The first MVP should focus on a single lesson only:

* C Major
* Shape 1

The overall design should resemble the attached reference image discussed earlier:

* cream / beige background
* dark fretboard lines
* black circles for scale tones
* white circles for roots
* faint semi-transparent circles for fretboard position markers
* rounded control panel
* simple Prev / Next / Play / Tempo controls

---

## Technical Approach

Start with plain HTML / CSS / JS.

Reasoning:

* The app is currently simple enough that React would add unnecessary complexity.
* The MVP only has one screen, one fretboard, one lesson, and a small amount of state.
* The most important design decision is separating lesson content from rendering and playback logic.

Potential future migration to React is fine if the app grows substantially.

---

## Core Architecture

Separate the app into four concerns:

1. Lesson data
2. Rendering
3. Playback
4. Audio

### Lesson data

Lesson content should live in JSON files.

The JSON should describe:

* instrument
* fretboard layout
* visible notes
* playback patterns
* instructions

Important:

Do NOT store raw x/y coordinates in lesson data.

Lesson data should use musical coordinates such as:

* string
* fret
* role
* note
* degree

The renderer should derive visual positions from those musical coordinates.

### Computed vs. stored playback patterns

Only store musically distinct sequences in the lesson JSON (`ascending`,
`descending`). Derived combinations — such as `"both"` (ascending then descending)
— should be computed at runtime in `LessonPlayer.getCurrentSequence()`, not stored
in JSON. This keeps the schema accurate, avoids sync issues when adding new lessons,
and keeps the join logic (e.g. skip the duplicate pivot note) in one place.

If a new combination mode is added, add a branch in `getCurrentSequence()` and
extend the whitelist in `setPlaybackPattern()`. Do not add new keys to lesson JSON
unless the sequence is genuinely lesson-specific and cannot be derived.

---

## Suggested Folder Structure

```text
bass-practice/
  index.html
  lesson-schema.tsp
  data/
    c-major-shape-1.json
  js/
    app.js
    lesson-player.js
    fretboard-renderer.js
    lesson-loader.js
    audio-engine.js
  css/
    styles.css
```

For the MVP, `audio-engine.js` can remain stubbed or omitted.

---

## TypeSpec Schema

Canonical schema should be defined in TypeSpec.

Suggested schema:

```typespec
alias InstrumentType = "bass";
alias NoteRole = "root" | "scale" | "target" | "ghost";

model InstrumentConfig {
  type: InstrumentType;
  strings: uint8;
  tuning: string[];
}

model LayoutConfig {
  startFret: uint8;
  fretCount: uint8;
  showFretLabels?: boolean = true;
  fretMarkers?: uint8[];
}

model DefaultConfig {
  tempo?: uint16 = 80;
  loop?: boolean = true;
  playbackPattern?: PlaybackPatternName = "ascending";
}

model VisibleNote {
  id: string;
  string: uint8;
  fret: uint8;
  degree?: uint8;
  note?: string;
  role: NoteRole;
}

model PlaybackPatterns {
  ascending?: string[];
  descending?: string[];
}

model Lesson {
  id: string;
  title: string;
  subtitle?: string;
  instrument: InstrumentConfig;
  layout: LayoutConfig;
  defaults?: DefaultConfig;
  visibleNotes: VisibleNote[];
  playbackPatterns: PlaybackPatterns;
  instructions?: string[];
}

model LessonSeries {
  id: string;
  title: string;
  lessons: string[];
}
```

---

## Lesson JSON Example

```json
{
  "id": "c-major-shape-1",
  "title": "C Major",
  "subtitle": "Shape 1",
  "instrument": {
    "type": "bass",
    "strings": 4,
    "tuning": ["E", "A", "D", "G"]
  },
  "layout": {
    "startFret": 2,
    "fretCount": 4,
    "showFretLabels": true,
    "fretMarkers": [3, 5]
  },
  "defaults": {
    "tempo": 80,
    "loop": true,
    "playbackPattern": "both"
  },
  "visibleNotes": [
    { "id": "n1",  "string": 1, "fret": 2, "note": "A", "degree": 6, "role": "scale" },
    { "id": "n2",  "string": 2, "fret": 2, "note": "E", "degree": 3, "role": "scale" },
    { "id": "n3",  "string": 3, "fret": 2, "note": "B", "degree": 7, "role": "scale" },
    { "id": "n4",  "string": 3, "fret": 3, "note": "C", "degree": 1, "role": "root"  },
    { "id": "n5",  "string": 2, "fret": 3, "note": "F", "degree": 4, "role": "scale" },
    { "id": "n6",  "string": 4, "fret": 3, "note": "G", "degree": 5, "role": "scale" },
    { "id": "n7",  "string": 1, "fret": 4, "note": "B", "degree": 7, "role": "scale" },
    { "id": "n8",  "string": 1, "fret": 5, "note": "C", "degree": 1, "role": "root"  },
    { "id": "n9",  "string": 2, "fret": 5, "note": "G", "degree": 5, "role": "scale" },
    { "id": "n10", "string": 3, "fret": 5, "note": "D", "degree": 2, "role": "scale" },
    { "id": "n11", "string": 4, "fret": 5, "note": "A", "degree": 6, "role": "scale" }
  ],
  "playbackPatterns": {
    "ascending":  ["n6", "n11", "n3", "n4", "n10", "n2", "n5", "n9", "n1", "n7", "n8"],
    "descending": ["n8", "n7", "n1", "n9", "n5", "n2", "n10", "n4", "n3", "n11", "n6"]
  }
}
```

---

## lesson-player.js Responsibilities

`lesson-player.js` should:

* load lesson data
* manage playback state
* manage tempo
* manage current playback pattern
* manage play / pause / stop
* track the currently active note
* tell the renderer which note is active
* eventually trigger audio playback

Suggested state shape:

```js
{
  tempo: 80,
  loop: true,
  playbackPattern: "both",  // "ascending" | "descending" | "both"
  isPlaying: false,
  activeStepIndex: -1,
  timerId: null
}
```

Suggested methods:

* `loadLesson()`
* `setTempo()`
* `setPlaybackPattern()`
* `play()`
* `pause()`
* `stop()`
* `nextStep()`
* `scheduleNextStep()`
* `getCurrentSequence()`
* `getNoteById()`

---

## fretboard-renderer.js Responsibilities

`fretboard-renderer.js` should:

* draw strings
* draw frets
* draw fret labels
* draw fretboard position markers
* draw notes
* visually distinguish roots vs scale tones
* highlight the active note

The renderer should not know about playback timing.

Suggested methods:

* `renderLesson()`
* `clear()`
* `drawFrame()`
* `drawFretMarkers()`
* `drawNotes()`
* `createNoteElement()`
* `setActiveNote()`
* `clearActiveNote()`

---

## audio-engine.js Responsibilities

`audio-engine.js` manages the metronome click track.

### Web Audio timing — do not use setTimeout for sound

`setTimeout` has ±10–50ms jitter from the JS event loop. At practice tempos this
is audible. Instead, use the **Web Audio lookahead scheduler** pattern:

* Schedule audio events onto `AudioContext.currentTime` (sample-accurate clock)
* Use `setTimeout` only to pump the scheduler every ~25ms
* Schedule events 100ms ahead — this gives a 75ms buffer against JS jitter

```js
_pump() {
  while (this._nextClickTime < this._context.currentTime + this._lookahead) {
    this._scheduleClick(this._nextClickTime);
    this._nextClickTime += 60.0 / this._tempo;
  }
  this._timerId = setTimeout(() => this._pump(), this._scheduleInterval);
}
```

### AudioContext initialization

`AudioContext` must be created (or resumed) after a user gesture — browsers block
audio that starts before any interaction. Initialize lazily on the first `start()`
call, not at module load time.

### Interface

* `start(tempo)` — begin metronome; initializes context if needed
* `stop()` — stop; clears the scheduler timeout
* `setTempo(bpm)` — update BPM; takes effect on the next scheduled beat

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `↑` | Increase tempo by 5 BPM (max 200) |
| `↓` | Decrease tempo by 5 BPM (min 40) |

Implemented in `app.js` via a `keydown` listener on `document`. Keypresses are
ignored when an `<input>` has focus so the tempo slider works normally.

---

## Build & Validation

Run `npm run validate` to compile `lesson-schema.tsp` → JSON Schema and validate
all `data/*.json` files against the generated `Lesson` schema.

The GitHub Actions workflow (`.github/workflows/build.yml`) runs this automatically
on every push and pull request.

When adding a new lesson JSON file, run `npm run validate` locally before committing.

---

## Coordinate System

Use musical coordinates rather than raw pixel coordinates.

### String numbering and TAB orientation

The fretboard diagram follows standard TAB notation — the perspective of a player
looking down at the instrument from above:

* String 1 (G, highest pitch) appears at the **top** of the diagram
* String 4 (E, lowest pitch) appears at the **bottom** of the diagram

This is the opposite of standard musical staff notation (where higher pitch = higher
on the page), but matches how a bassist sees the neck when playing.

String numbering convention:

* `string: 1` = G string (thinnest, highest pitch) → top of diagram
* `string: 2` = D string
* `string: 3` = A string
* `string: 4` = E string (thickest, lowest pitch) → bottom of diagram

The renderer's y-position formula reflects this directly:

```js
// string 1 maps to stringTop (smallest y), string 4 maps to stringBottom (largest y)
y = stringTop + (string - 1) * stringSpacing
```

### Fret numbering

Fret numbers refer to standard guitar fret positions. The nut is the leftmost boundary
of the diagram and is **not** counted as a fret. The space between the nut and the first
fret wire is fret 1; the space between the first and second fret wires is fret 2; and so on.

Lesson data uses the actual fret number (e.g. `"fret": 3` means the 3rd fret of the neck).

### Fret column layout

The renderer derives visual x-positions from the unique fret numbers present in
`visibleNotes`. It spaces them evenly across the fret zone:

```js
// N unique frets → N+1 equally-spaced wires, note columns at wire midpoints
const spacing = (fretRight - fretLeft) / uniqueFrets.length;
const wires = uniqueFrets.map((_, i) => fretLeft + i * spacing).concat([fretRight]);
const columnX = (wires[i] + wires[i + 1]) / 2; // center of column i
```

---

## Current State

The MVP is complete. What's shipped:

* one lesson (C Major, Shape 1)
* SVG fretboard rendered from JSON lesson data
* ascending, descending, and ascending+descending (both) playback modes
* looping playback
* tempo slider (40–200 BPM)
* keyboard shortcuts: Space (play/pause), ↑/↓ (tempo)
* metronome click track via Web Audio lookahead scheduler
* TypeSpec schema with CI validation on every push

---

## Future Ideas

Possible future additions:

* note audio using Web Audio API (pitch synthesis per note)
* additional scale families
* series navigation
* pentatonic lessons
* interval drills
* user preferences
* alternate tunings
* finger suggestions
* random practice mode
* saved progress
* eventual React migration if complexity grows
