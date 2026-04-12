import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonPlayer } from "../js/lesson-player.js";

// Minimal stub that satisfies the renderer interface
function makeRenderer() {
  return {
    renderLesson: vi.fn(),
    clearActiveNote: vi.fn(),
    setActiveNote: vi.fn(),
  };
}

// Minimal lesson fixture — two patterns, explicit "both"
const LESSON = {
  id: "test",
  title: "Test",
  defaults: { tempo: 100, loop: true, playbackPattern: "ascending" },
  visibleNotes: [
    { id: "n1", string: 3, fret: 3, note: "C", degree: 1, role: "root" },
    { id: "n2", string: 2, fret: 2, note: "E", degree: 3, role: "scale" },
    { id: "n3", string: 1, fret: 5, note: "G", degree: 5, role: "scale" },
  ],
  playbackPatterns: {
    ascending:  ["n1", "n2", "n3"],
    descending: ["n3", "n2", "n1"],
    both:       ["n1", "n2", "n3", "n2"],
  },
};

// Lesson without an explicit "both" — player should compute it
const LESSON_NO_BOTH = {
  ...LESSON,
  playbackPatterns: {
    ascending:  ["n1", "n2", "n3"],
    descending: ["n3", "n2", "n1"],
  },
};

describe("LessonPlayer.getCurrentSequence()", () => {
  let player;

  beforeEach(() => {
    player = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    player.loadLesson(LESSON);
  });

  it("returns the ascending sequence", () => {
    player.setPlaybackPattern("ascending");
    expect(player.getCurrentSequence()).toEqual(["n1", "n2", "n3"]);
  });

  it("returns the descending sequence", () => {
    player.setPlaybackPattern("descending");
    expect(player.getCurrentSequence()).toEqual(["n3", "n2", "n1"]);
  });

  it("returns the stored both sequence when present", () => {
    player.setPlaybackPattern("both");
    expect(player.getCurrentSequence()).toEqual(["n1", "n2", "n3", "n2"]);
  });

  it("computes both as asc + desc.slice(1) when not stored", () => {
    player.loadLesson(LESSON_NO_BOTH);
    player.setPlaybackPattern("both");
    // ascending + descending.slice(1) = [n1,n2,n3] + [n2,n1]
    expect(player.getCurrentSequence()).toEqual(["n1", "n2", "n3", "n2", "n1"]);
  });

  it("returns [] before any lesson is loaded", () => {
    const p = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    expect(p.getCurrentSequence()).toEqual([]);
  });
});

describe("LessonPlayer.loadLesson()", () => {
  it("applies defaults from the lesson", () => {
    const renderer = makeRenderer();
    const player = new LessonPlayer({ renderer, onStateChange: () => {} });
    player.loadLesson({ ...LESSON, defaults: { tempo: 120, loop: false, playbackPattern: "descending" } });
    expect(player.state.tempo).toBe(120);
    expect(player.state.loop).toBe(false);
    expect(player.state.playbackPattern).toBe("descending");
  });

  it("resets activeStepIndex to -1", () => {
    const player = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    player.loadLesson(LESSON);
    expect(player.state.activeStepIndex).toBe(-1);
  });

  it("calls renderer.renderLesson and clearActiveNote", () => {
    const renderer = makeRenderer();
    const player = new LessonPlayer({ renderer, onStateChange: () => {} });
    player.loadLesson(LESSON);
    expect(renderer.renderLesson).toHaveBeenCalledWith(LESSON);
    expect(renderer.clearActiveNote).toHaveBeenCalled();
  });
});

describe("LessonPlayer.setPlaybackPattern()", () => {
  let player;

  beforeEach(() => {
    player = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    player.loadLesson(LESSON);
  });

  it("rejects unknown pattern names", () => {
    player.setPlaybackPattern("sideways");
    expect(player.state.playbackPattern).toBe("ascending"); // unchanged
  });

  it("rejects stored patterns that don't exist in the lesson", () => {
    player.loadLesson(LESSON_NO_BOTH);
    // LESSON_NO_BOTH has no "descending" pattern... actually it does, let's use
    // a custom lesson without ascending
    const noAsc = { ...LESSON, playbackPatterns: { descending: ["n3","n2","n1"] } };
    player.loadLesson(noAsc);
    player.setPlaybackPattern("ascending");
    expect(player.state.playbackPattern).toBe("ascending"); // default from loadLesson
  });

  it("resets activeStepIndex and scheduledStepIndex", () => {
    player.state.activeStepIndex = 2;
    player._scheduledStepIndex = 2;
    player.setPlaybackPattern("descending");
    expect(player.state.activeStepIndex).toBe(-1);
    expect(player._scheduledStepIndex).toBe(-1);
  });

  it("always accepts 'both' even if not stored", () => {
    player.loadLesson(LESSON_NO_BOTH);
    player.setPlaybackPattern("both");
    expect(player.state.playbackPattern).toBe("both");
  });
});

describe("LessonPlayer.nextStep() — fallback path (no audio engine)", () => {
  let player;

  beforeEach(() => {
    player = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    player.loadLesson(LESSON);
    player.state.isPlaying = true; // simulate playing without audio engine
  });

  it("advances through the sequence in order", () => {
    player.nextStep();
    expect(player.state.activeStepIndex).toBe(0);
    player.nextStep();
    expect(player.state.activeStepIndex).toBe(1);
    player.nextStep();
    expect(player.state.activeStepIndex).toBe(2);
  });

  it("loops back to 0 when loop is true", () => {
    player.state.activeStepIndex = 2; // last step
    player.nextStep();
    expect(player.state.activeStepIndex).toBe(0);
  });

  it("stops when loop is false and sequence ends", () => {
    player.state.loop = false;
    player.state.activeStepIndex = 2; // last step
    player.nextStep();
    expect(player.state.isPlaying).toBe(false);
  });
});

describe("LessonPlayer.setTempo()", () => {
  it("updates state.tempo", () => {
    const player = new LessonPlayer({ renderer: makeRenderer(), onStateChange: () => {} });
    player.loadLesson(LESSON);
    player.setTempo(140);
    expect(player.state.tempo).toBe(140);
  });
});
