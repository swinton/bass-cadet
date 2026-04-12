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
* supporting ascending and descending playback
* supporting adjustable tempo
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

Separate the app into three concerns:

1. Lesson data
2. Rendering
3. Playback

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
  playbackPattern?: string = "ascending";
}

model VisibleNote {
  id: string;
  string: uint8;
  fret: uint8;
  degree?: uint8;
  note?: string;
  role: NoteRole;
}

alias PlaybackPatterns = Record<string[]>;

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
    "startFret": 3,
    "fretCount": 5,
    "showFretLabels": true,
    "fretMarkers": [3, 5]
  },
  "defaults": {
    "tempo": 80,
    "loop": true,
    "playbackPattern": "ascending"
  },
  "visibleNotes": [
    { "id": "n1", "string": 4, "fret": 3, "role": "scale" },
    { "id": "n2", "string": 3, "fret": 3, "role": "scale" },
    { "id": "n3", "string": 2, "fret": 3, "role": "scale" },
    { "id": "n4", "string": 3, "fret": 5, "role": "scale" },
    { "id": "n5", "string": 2, "fret": 5, "role": "root" },
    { "id": "n6", "string": 1, "fret": 5, "role": "scale" },
    { "id": "n7", "string": 4, "fret": 7, "role": "scale" },
    { "id": "n8", "string": 4, "fret": 8, "role": "root" },
    { "id": "n9", "string": 3, "fret": 8, "role": "scale" },
    { "id": "n10", "string": 2, "fret": 8, "role": "scale" },
    { "id": "n11", "string": 1, "fret": 8, "role": "scale" }
  ],
  "playbackPatterns": {
    "ascending": ["n5", "n2", "n4", "n1", "n7", "n8", "n9", "n3", "n10", "n6", "n11"],
    "descending": ["n11", "n6", "n10", "n3", "n9", "n8", "n7", "n1", "n4", "n2", "n5"]
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
  playbackPattern: "ascending",
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

## Coordinate System

Use musical coordinates rather than raw pixel coordinates.

Suggested convention:

* string 1 = highest string
* string 4 = lowest string

Suggested helper:

```js
function getNotePosition(note, layout, instrument, geometry) {
  const { left, top, width, height } = geometry;

  const stringCount = instrument.strings;
  const stringSpacing = height / (stringCount - 1);

  const fretOffset = note.fret - layout.startFret;
  const fretWidth = width / layout.fretCount;

  const x = left + (fretOffset + 0.5) * fretWidth;
  const y = top + (stringCount - note.string) * stringSpacing;

  return { x, y };
}
```

---

## MVP Scope

The MVP should include:

* one lesson only
* one HTML page
* one lesson JSON file
* one TypeSpec schema file
* visual playback only
* tempo slider
* play / pause button
* ascending / descending mode
* looping playback

Audio can come later.

---

## Future Ideas

Possible future additions:

* note audio using Web Audio API
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
