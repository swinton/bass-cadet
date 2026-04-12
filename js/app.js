import { FretboardRenderer } from "./fretboard-renderer.js";
import { LessonPlayer } from "./lesson-player.js";
import { loadLesson } from "./lesson-loader.js";

function main() {
  const titleEl = document.querySelector("#title");
  const subtitleEl = document.querySelector("#subtitle");
  const svgEl = document.querySelector("#fretboard");
  const labelsEl = document.querySelector("#fret-labels");
  const playBtn = document.querySelector("#play-btn");
  const patternSelect = document.querySelector("#pattern-select");
  const tempoInput = document.querySelector("#tempo");
  const tempoValue = document.querySelector("#tempo-value");
  const activeNoteLabel = document.querySelector("#active-note-label");

  const renderer = new FretboardRenderer({ svgEl, labelsEl });
  const player = new LessonPlayer({
    renderer,
    onStateChange: ({ lesson, state }) => {
      if (lesson) {
        titleEl.textContent = lesson.title;
        subtitleEl.textContent = lesson.subtitle || "";
      }
      playBtn.textContent = state.isPlaying ? "❚❚ Pause" : "▶ Play";
      patternSelect.value = state.playbackPattern;
      tempoInput.value = state.tempo;
      tempoValue.textContent = `${state.tempo} BPM`;

      const sequence = lesson?.playbackPatterns?.[state.playbackPattern] ?? [];
      const activeId = sequence[state.activeStepIndex] || null;
      const activeNote = lesson?.visibleNotes?.find(n => n.id === activeId) || null;
      activeNoteLabel.textContent = activeNote
        ? `${activeNote.note || "?"} · string ${activeNote.string} · fret ${activeNote.fret}`
        : "—";
    }
  });

  playBtn.addEventListener("click", () => player.togglePlay());
  patternSelect.addEventListener("change", e => player.setPlaybackPattern(e.target.value));
  tempoInput.addEventListener("input", e => player.setTempo(Number(e.target.value)));

  loadLesson("./data/c-major-shape-1.json")
    .then(lesson => player.loadLesson(lesson))
    .catch(err => {
      console.error(err);
      activeNoteLabel.textContent = `Error: ${err.message}`;
    });
}

main();
