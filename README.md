# 🎸 Bass Cadet

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
- Ascending, descending, and ascending+descending playback modes
- Adjustable tempo (40–200 BPM) via slider or ↑/↓ keys
- Looping playback
- Active note highlighted in sequence
- Roots and scale tones visually distinguished
- Metronome click track (Web Audio lookahead scheduler)
- Bass synth note audio per step, with mute toggle
- Bookmarkable lessons via `?lesson=<id>` URL parameter

## Lessons

| Lesson | Direct link |
|---|---|
| C Major — Shape 1 | [?lesson=c-major-shape-1](https://swinton.github.io/bass-practitioner/?lesson=c-major-shape-1) |
| C Major Pentatonic — Shape 1 | [?lesson=c-major-pentatonic-shape-1](https://swinton.github.io/bass-practitioner/?lesson=c-major-pentatonic-shape-1) |
| A Minor Pentatonic — Position 1 | [?lesson=a-minor-pentatonic-position-1](https://swinton.github.io/bass-practitioner/?lesson=a-minor-pentatonic-position-1) |
| C Major Arpeggio | [?lesson=c-major-arpeggio](https://swinton.github.io/bass-practitioner/?lesson=c-major-arpeggio) |
| C Major Seventh Arpeggio | [?lesson=c-major-seventh-arpeggio](https://swinton.github.io/bass-practitioner/?lesson=c-major-seventh-arpeggio) |

## Project structure

```
bass/
  index.html              # App shell
  lesson-schema.tsp       # TypeSpec schema for lesson data
  data/
    lessons.json                        # Ordered lesson registry
    c-major-shape-1.json
    c-major-pentatonic-shape-1.json
    a-minor-pentatonic-position-1.json
    c-major-arpeggio.json
    c-major-seventh-arpeggio.json
  css/
    styles.css
  js/
    app.js                # Entry point — wires DOM, renderer, player, and audio
    fretboard-renderer.js # SVG fretboard drawing
    lesson-player.js      # Playback state machine
    lesson-loader.js      # Fetches lesson JSON
    audio-engine.js       # Metronome + bass synth (Web Audio API)
  scripts/
    validate-lessons.js   # Validates data/*.json against TypeSpec schema
```

## Lesson data

Lessons are defined in JSON using musical coordinates (string number, fret number, note name, scale degree, role). The renderer derives all pixel positions at runtime — coordinates are never stored in lesson files.

String numbering follows TAB convention: **string 1 (G) is at the top** of the diagram, string 4 (E) is at the bottom. This matches the perspective of a player looking down at the neck.

To add a new lesson: create a `data/<id>.json` file and append the ID to `data/lessons.json`. No other changes needed.

See `CLAUDE.md` for the full schema, coordinate system, and architecture documentation.

## Validation

```sh
npm run validate
```

Compiles `lesson-schema.tsp` to JSON Schema and validates all lesson files in `data/`. Also runs automatically on every push via GitHub Actions.
