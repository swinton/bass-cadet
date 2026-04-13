# 🎸 Bass Cadet

**Live:** https://swinton.github.io/bass-cadet/

A visual practice tool for bass guitarists, built around a CAGED-style system for the bass neck. The goal is to help you internalise scales across the entire neck — not just one position — and understand how the modes connect horizontally within a position.

Navigate **up the neck** to see the same scale in different positions. Navigate **across** to move between adjacent scale shapes in the same region, building a mental map of the modes as natural neighbours rather than abstract theory.

## Lessons

| Lesson | Direct link |
|---|---|
| C Major — Shape 1 | [?lesson=c-major-shape-1](https://swinton.github.io/bass-cadet/?lesson=c-major-shape-1) |
| C Major Pentatonic — Shape 1 | [?lesson=c-major-pentatonic-shape-1](https://swinton.github.io/bass-cadet/?lesson=c-major-pentatonic-shape-1) |
| A Minor Pentatonic — Position 1 | [?lesson=a-minor-pentatonic-position-1](https://swinton.github.io/bass-cadet/?lesson=a-minor-pentatonic-position-1) |
| C Major Arpeggio | [?lesson=c-major-arpeggio](https://swinton.github.io/bass-cadet/?lesson=c-major-arpeggio) |
| C Major Seventh Arpeggio | [?lesson=c-major-seventh-arpeggio](https://swinton.github.io/bass-cadet/?lesson=c-major-seventh-arpeggio) |

## Adding a lesson

1. Create `data/<id>.json` — musical coordinates only (string, fret, note, degree, role). See `CLAUDE.md` for the full schema and an example.
2. Append the ID to `data/lessons.json`.
3. Run `npm run validate` to check the new file against the TypeSpec schema.

No other changes needed — the renderer derives all fretboard positions at runtime.
