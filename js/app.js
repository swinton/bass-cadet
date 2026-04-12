import { FretboardRenderer } from "./fretboard-renderer.js";
import { LessonPlayer } from "./lesson-player.js";
import { AudioEngine } from "./audio-engine.js";
import { loadLesson } from "./lesson-loader.js";

async function loadRegistry() {
  const res = await fetch("./data/lessons.json");
  if (!res.ok) throw new Error("Failed to load lesson registry");
  return res.json();
}

function lessonIdFromUrl(registry) {
  const param = new URLSearchParams(location.search).get("lesson");
  return (param && registry.includes(param)) ? param : registry[0];
}

function main() {
  const titleEl = document.querySelector("#title");
  const subtitleEl = document.querySelector("#subtitle");
  const svgEl = document.querySelector("#fretboard");
  const labelsEl = document.querySelector("#fret-labels");
  const playBtn = document.querySelector("#play-btn");
  const muteBtn = document.querySelector("#mute-btn");
  const prevBtn = document.querySelector("#prev-btn");
  const nextBtn = document.querySelector("#next-btn");
  const shapeLabel = document.querySelector("#shape-label");
  const patternBtns = document.querySelectorAll(".pattern-btn");
  const tempoInput = document.querySelector("#tempo");
  const tempoValue = document.querySelector("#tempo-value");
  const activeNoteLabel = document.querySelector("#active-note-label");

  const renderer = new FretboardRenderer({ svgEl, labelsEl });
  const audioEngine = new AudioEngine();
  const player = new LessonPlayer({
    renderer,
    audioEngine,
    onStateChange: ({ lesson, state }) => {
      if (lesson) {
        titleEl.textContent = lesson.title;
        subtitleEl.textContent = lesson.subtitle || "";
        shapeLabel.textContent = lesson.subtitle || "";
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

  let registry = [];

  function updateNav(id) {
    const idx = registry.indexOf(id);
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= registry.length - 1;
  }

  function navigateToLesson(id) {
    player.stop();
    history.pushState({ lesson: id }, "", `?lesson=${id}`);
    updateNav(id);
    loadLesson(`./data/${id}.json`)
      .then(lesson => player.loadLesson(lesson))
      .catch(err => {
        console.error(err);
        activeNoteLabel.textContent = `Error: ${err.message}`;
      });
  }

  playBtn.addEventListener("click", () => player.togglePlay());
  muteBtn.addEventListener("click", () => {
    const muted = audioEngine.toggleMute();
    muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
    muteBtn.setAttribute("aria-pressed", String(muted));
  });
  prevBtn.addEventListener("click", () => {
    const idx = registry.indexOf(lessonIdFromUrl(registry));
    if (idx > 0) navigateToLesson(registry[idx - 1]);
  });
  nextBtn.addEventListener("click", () => {
    const idx = registry.indexOf(lessonIdFromUrl(registry));
    if (idx < registry.length - 1) navigateToLesson(registry[idx + 1]);
  });
  document.querySelector(".pattern-toggle").addEventListener("click", e => {
    const btn = e.target.closest(".pattern-btn");
    if (btn) player.setPlaybackPattern(btn.dataset.pattern);
  });
  tempoInput.addEventListener("input", e => player.setTempo(Number(e.target.value)));

  window.addEventListener("popstate", () => {
    const id = lessonIdFromUrl(registry);
    updateNav(id);
    loadLesson(`./data/${id}.json`)
      .then(lesson => player.loadLesson(lesson))
      .catch(err => {
        console.error(err);
        activeNoteLabel.textContent = `Error: ${err.message}`;
      });
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

  loadRegistry()
    .then(reg => {
      registry = reg;
      const id = lessonIdFromUrl(registry);
      updateNav(id);
      return loadLesson(`./data/${id}.json`);
    })
    .then(lesson => player.loadLesson(lesson))
    .catch(err => {
      console.error(err);
      activeNoteLabel.textContent = `Error: ${err.message}`;
    });
}

main();
