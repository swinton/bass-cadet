# Bass Scale Practice

**Live:** https://swinton.github.io/bass-practitioner/

A single-page web app for practicing bass guitar scales visually.

The fretboard displays one scale shape at a time, highlighting notes in sequence as you play along. No frameworks, no build step — plain HTML, CSS, and JavaScript.

## Running locally

ES modules require a local HTTP server (`file://` won't work).

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Features

- SVG fretboard rendered from lesson data (no hardcoded coordinates)
- Ascending and descending playback modes
- Adjustable tempo (40–200 BPM)
- Looping playback
- Active note highlighted in sequence
- Roots and scale tones visually distinguished

## Project structure

```
bass/
  index.html              # App shell
  lesson-schema.tsp       # TypeSpec schema for lesson data
  data/
    c-major-shape-1.json  # Lesson data
  css/
    styles.css
  js/
    app.js                # Entry point — wires DOM, renderer, and player
    fretboard-renderer.js # SVG fretboard drawing
    lesson-player.js      # Playback state machine
    lesson-loader.js      # Fetches lesson JSON
    audio-engine.js       # Stub for future Web Audio API support
```

## Lesson data

Lessons are defined in JSON using musical coordinates (string number, fret number, note name, scale degree, role). The renderer derives all pixel positions at runtime — coordinates are never stored in lesson files.

String numbering follows TAB convention: **string 1 (G) is at the top** of the diagram, string 4 (E) is at the bottom. This matches the perspective of a player looking down at the neck.

See `CLAUDE.md` for the full schema and coordinate system documentation.

## Current lesson

**C Major — Shape 1** covers frets 2–5 across all four strings, with roots on the A string (fret 3) and G string (fret 5).
