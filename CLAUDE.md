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

---

## Long-term Vision: CAGED-style system for bass

The ultimate goal is a **CAGED-like system for bass** — a structured way to visualise
and internalise scales across the entire neck, starting with C Major and extending to
other scales and keys.

There are two axes of navigation:

### Vertical axis — positions up the neck

The same scale pattern shifted to different fret positions (e.g. C Major Shape 1 at
frets 2–5, Shape 2 at frets 5–8, Shape 3 at frets 7–10, etc.). Each shape covers the
same notes/scale but uses a different fingering region. Moving through positions teaches
the player how a single scale lives all over the neck.

### Horizontal axis — modes in position

Staying in the same fret region but moving to an adjacent scale shape — effectively
rotating the starting degree — produces the modes. For example, starting the C Major
pattern from D in the same position gives D Dorian; from E gives E Phrygian; and so on.
This "horizontal" navigation builds a mental model of the modes as natural neighbours
rather than abstract theory.

### Design implications

* Lessons need a `position` (fret region) and a `shape` (which degree the pattern
  starts on) so the UI can offer both axes of navigation.
* The Prev/Next controls already handle vertical navigation within a scale family.
  A future "Mode" control (or second navigation row) will handle horizontal navigation.
* The fretboard renderer must handle lessons at any fret position, not just frets 1–5.
  Fret labels and neck position markers (dots at 3, 5, 7, 9, 12) must reflect the
  actual fret numbers in the displayed window.
* A `data/lessons.json` series structure (or separate series files) will group lessons
  by scale family and key so the UI knows which lessons are neighbours on each axis.

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

The `"both"` playback mode can be either computed at runtime or stored explicitly
in the lesson JSON, depending on whether the sequence is generically derivable.

**Compute at runtime** (preferred default) when `both` is simply ascending then
descending with the shared pivot note played once. `getCurrentSequence()` handles
this: `[...ascending, ...descending.slice(1)]`.

**Store explicitly** as `playbackPatterns.both` when the pattern has custom logic
that can't be derived — for example, when the sequence travels below the root after
descending (all current lessons do this). `getCurrentSequence()` checks for a stored
`both` first and falls back to the computed version, so lessons that don't need
custom behaviour don't have to provide it.

Rule of thumb: if you need the player to visit sub-root notes or change direction
more than once, store `both` explicitly. Otherwise omit it.

If a new combination mode is added, add a branch in `getCurrentSequence()` and
extend the whitelist in `setPlaybackPattern()`. Do not add new playback-mode keys
to the schema unless they represent genuinely distinct musical sequences.

---

## Suggested Folder Structure

```text
bass-cadet/
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

`audio-engine.js` manages the metronome click track and bass note synthesis. It
also drives note scheduling for `LessonPlayer` via an `onBeat` callback — see
**Dual-clock sync** below.

### Web Audio timing — do not use setTimeout for sound

`setTimeout` has ±10–50ms jitter from the JS event loop. At practice tempos this
is audible. Instead, use the **Web Audio lookahead scheduler** pattern:

* Schedule audio events onto `AudioContext.currentTime` (sample-accurate clock)
* Use `setTimeout` only to pump the scheduler every ~25ms
* Schedule events 100ms ahead — this gives a 75ms buffer against JS jitter

```js
_pump() {
  while (this._nextClickTime < this._context.currentTime + this._lookahead) {
    const time = this._nextClickTime;
    const duration = 60.0 / this._tempo;
    if (!this._isMuted) this._scheduleClick(time);
    this._onBeat?.(time, duration);  // drives LessonPlayer note scheduling
    this._nextClickTime += duration;
  }
  this._timerId = setTimeout(() => this._pump(), this._scheduleInterval);
}
```

### AudioContext initialization

`AudioContext` must be created (or resumed) after a user gesture — browsers block
audio that starts before any interaction. Initialize lazily on the first `start()`
call, not at module load time.

### Interface

* `start(tempo, onBeat?)` — begin metronome; `onBeat(beatTime, beatDuration)` is
  called inside the pump for every scheduled beat so callers can schedule audio on
  the same Web Audio clock
* `stop()` — stop; clears the scheduler timeout
* `setTempo(bpm)` — update BPM; takes effect on the next scheduled beat
* `playNote(note, duration, time?)` — synthesise a bass note; `time` pins it to a
  specific Web Audio clock time (pass the `beatTime` from `onBeat`)
* `get context` — exposes the `AudioContext` so callers can compute delays against
  the same clock

---

## Dual-clock sync

**Problem:** the metronome click is scheduled up to 100ms ahead on the Web Audio
clock. If note audio is played at `ctx.currentTime` (JS thread time), it drifts
against the click — noticeably so when tempo is changed mid-playback.

**Solution:** `LessonPlayer` registers an `onBeat` callback with
`audioEngine.start()`. For each beat the pump fires both the click *and* the
callback at the same scheduled `beatTime`. `LessonPlayer._advanceStep()`:

1. Calls `audioEngine.playNote(note, duration, beatTime)` — audio lands exactly
   with the click.
2. Computes `delayMs = (beatTime - ctx.currentTime) * 1000` and fires a
   `setTimeout` to move the visual highlight to arrive at the same moment.

```js
// lesson-player.js — _advanceStep
this.audioEngine.playNote(note, beatDuration, beatTime);        // audio on Web Audio clock
const delayMs = (beatTime - ctx.currentTime) * 1000;
setTimeout(() => {
  this.renderer.setActiveNote(noteId);                          // visual in sync
}, Math.max(0, delayMs));
```

Consequences:
* `setTempo()` no longer restarts `scheduleNextStep()` — the pump picks up the
  new tempo automatically on its next interval, and already-committed beats play
  at their scheduled times.
* `_scheduledStepIndex` tracks which step has been *audio-scheduled* (ahead of
  time); `state.activeStepIndex` tracks which step is *visually active* (present
  time). They are intentionally different during the lookahead window.
* The no-audioEngine fallback path (`scheduleNextStep` / `nextStep`) is kept for
  testing or environments without Web Audio.

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

The renderer derives visual x-positions from the full fret range declared by
`layout.startFret` and `layout.fretCount` — **not** from the frets present in
`visibleNotes`. This ensures fret position markers and note circles always land at
the correct absolute fret position regardless of which frets have notes in a lesson.

```js
// fretCount columns → fretCount+1 equally-spaced wires, note columns at wire midpoints
const allFrets = Array.from({ length: fretCount }, (_, i) => startFret + i);
const spacing = (fretRight - fretLeft) / fretCount;
const wires = allFrets.map((_, i) => fretLeft + i * spacing).concat([fretRight]);
const columnX = (wires[i] + wires[i + 1]) / 2; // center of column i
```

---

## Current State

What's shipped:

* 5 lessons: C Major Shape 1, C Major Pentatonic Shape 1, A Minor Pentatonic
  Position 1, C Major Arpeggio, C Major Seventh Arpeggio
* SVG fretboard rendered from JSON lesson data
* Bookmarkable lessons via `?lesson=<id>` URL param; lesson registry in
  `data/lessons.json`; Prev/Next navigation with `history.pushState`; browser
  back/forward via `popstate`; lesson dropdown in the legend bar
* Dynamic root legend label derived from the loaded lesson's root note
* Ascending, descending, and ascending+descending (both) playback modes
* Looping playback
* Tempo slider (40–200 BPM, step 5); keyboard shortcuts: Space (play/pause),
  ↑/↓ (tempo ±5 BPM)
* Metronome click track via Web Audio lookahead scheduler
* Bass synth note audio per step (sawtooth + sub-octave sine → low-pass filter
  → amplitude envelope); mute toggle
* Dual-clock sync: note audio and visual highlights both driven from the same
  Web Audio `beatTime`, eliminating click/synth drift on tempo changes
* TypeSpec schema with CI validation on every push; playback pattern IDs
  validated against `visibleNotes` at build time
* Unit tests (Vitest, 22 tests) and e2e smoke tests (Playwright, 14 tests)

---

## Roadmap

### Near-term
* Complete C Major shapes across all neck positions (vertical axis)
* Renderer support for lessons beyond frets 1–5: fret labels showing actual fret
  numbers, neck position markers (dots) at correct positions within the displayed window
* Series metadata in `data/lessons.json` (or separate series files) to group lessons
  by scale family, key, and axis so the UI can offer two-axis navigation

### Medium-term
* Horizontal axis navigation — move between modes in the same fret region
* UI affordance for the two axes (e.g. a second Prev/Next row labelled "Mode")
* Extend the system to other scale families (pentatonic, blues, etc.) and other keys

### Later
* Interval drills and ear training
* Finger / position suggestions
* User preferences (default tempo, preferred playback mode, saved progress)
* Alternate tunings (5-string, drop-D) — requires updating `OPEN_STRING_HZ` in audio engine
* Random practice mode
* Eventual React migration if complexity grows
