import { FretboardRenderer } from "./fretboard-renderer.js";
import { LessonPlayer } from "./lesson-player.js";
import { AudioEngine } from "./audio-engine.js";
import { loadLesson } from "./lesson-loader.js";

// Open-string Hz — mirrors AudioEngine, used to derive drone frequencies
const OPEN_STRING_HZ = { 1: 97.9989, 2: 73.4162, 3: 55.0, 4: 41.2034 };

/**
 * Compute root and fifth drone frequencies from a lesson.
 * Picks the lowest root, then the lowest fifth at or above that root so the
 * fifth always sits above the root in the drone mix.
 */
function getDroneFreqs(lesson) {
  const toHz = n => OPEN_STRING_HZ[n.string] * Math.pow(2, n.fret / 12);
  const roots  = lesson.visibleNotes.filter(n => n.role === "root").map(toHz);
  const fifths = lesson.visibleNotes.filter(n => n.degree === 5).map(toHz);
  const rootHz  = Math.min(...roots);
  const fifthHz = fifths.filter(f => f >= rootHz).sort((a, b) => a - b)[0]
               ?? fifths.sort((a, b) => a - b).at(-1);
  return { root: rootHz, fifth: fifthHz };
}

function main() {
  const titleEl = document.querySelector("#title");
  const subtitleEl = document.querySelector("#subtitle");
  const svgEl = document.querySelector("#fretboard");
  const labelsEl = document.querySelector("#fret-labels");
  const playBtn = document.querySelector("#play-btn");
  const muteBtn = document.querySelector("#mute-btn");
  const patternBtns = document.querySelectorAll(".pattern-btn");
  const tempoInput = document.querySelector("#tempo");
  const tempoValue = document.querySelector("#tempo-value");
  const activeNoteLabel = document.querySelector("#active-note-label");
  const droneBtns = document.querySelectorAll(".drone-btn");
  const droneVolumeInput = document.querySelector("#drone-volume");

  let droneMode = "off";
  let droneFreqs = null; // set when lesson loads

  const renderer = new FretboardRenderer({ svgEl, labelsEl });
  const audioEngine = new AudioEngine();
  const player = new LessonPlayer({
    renderer,
    audioEngine,
    onStateChange: ({ lesson, state }) => {
      if (lesson) {
        titleEl.textContent = lesson.title;
        subtitleEl.textContent = lesson.subtitle || "";
      }
      playBtn.textContent = state.isPlaying ? "❚❚ Pause" : "▶ Play";
      patternBtns.forEach(btn => {
        const isActive = btn.dataset.pattern === state.playbackPattern;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
      tempoInput.value = state.tempo;
      tempoValue.textContent = `${state.tempo} BPM`;

      const sequence = player.getCurrentSequence();
      const activeId = sequence[state.activeStepIndex] || null;
      const activeNote = lesson?.visibleNotes?.find(n => n.id === activeId) || null;
      activeNoteLabel.textContent = activeNote
        ? `${activeNote.note || "?"} · string ${activeNote.string} · fret ${activeNote.fret}`
        : "—";
    }
  });

  playBtn.addEventListener("click", () => player.togglePlay());
  muteBtn.addEventListener("click", () => {
    const muted = audioEngine.toggleMute();
    muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
    muteBtn.setAttribute("aria-pressed", String(muted));
  });
  document.querySelector(".pattern-toggle").addEventListener("click", e => {
    const btn = e.target.closest(".pattern-btn");
    if (btn) player.setPlaybackPattern(btn.dataset.pattern);
  });
  tempoInput.addEventListener("input", e => player.setTempo(Number(e.target.value)));

  // --- Drone controls ---

  function droneVolume() {
    return Number(droneVolumeInput.value) / 100 * 0.3; // slider 0-100 → gain 0-0.3
  }

  function applyDroneMode(mode) {
    droneMode = mode;
    droneBtns.forEach(btn => {
      const active = btn.dataset.drone === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if (mode === "off") {
      audioEngine.stopDrone();
    } else if (mode === "root" && droneFreqs) {
      audioEngine.startDrone([droneFreqs.root], droneVolume());
    } else if (mode === "fifth" && droneFreqs) {
      audioEngine.startDrone([droneFreqs.root, droneFreqs.fifth], droneVolume());
    }
  }

  document.querySelector(".drone-toggle").addEventListener("click", e => {
    const btn = e.target.closest(".drone-btn");
    if (btn) applyDroneMode(btn.dataset.drone);
  });

  droneVolumeInput.addEventListener("input", () => {
    audioEngine.setDroneVolume(droneVolume());
  });

  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT") return; // don't intercept when typing in a field
    if (e.key === " ") {
      e.preventDefault();
      player.togglePlay();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      player.setTempo(Math.min(200, player.state.tempo + 5));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      player.setTempo(Math.max(40, player.state.tempo - 5));
    }
  });

  loadLesson("./data/c-major-shape-1.json")
    .then(lesson => {
      player.loadLesson(lesson);
      droneFreqs = getDroneFreqs(lesson);
      // Re-apply drone if it was active before the lesson loaded
      if (droneMode !== "off") applyDroneMode(droneMode);
    })
    .catch(err => {
      console.error(err);
      activeNoteLabel.textContent = `Error: ${err.message}`;
    });
}

main();
