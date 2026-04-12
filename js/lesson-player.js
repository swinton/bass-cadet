export class LessonPlayer {
  constructor({ renderer, audioEngine, onStateChange }) {
    this.renderer = renderer;
    this.audioEngine = audioEngine || null;
    this.onStateChange = onStateChange || (() => {});
    this.lesson = null;
    this._scheduledStepIndex = -1;
    this.state = {
      tempo: 80,
      loop: true,
      playbackPattern: "ascending",
      isPlaying: false,
      activeStepIndex: -1,
      timerId: null
    };
  }

  loadLesson(lesson) {
    this.stop();
    this.lesson = lesson;
    this.state.tempo = lesson.defaults?.tempo ?? 80;
    this.state.loop = lesson.defaults?.loop ?? true;
    this.state.playbackPattern = lesson.defaults?.playbackPattern ?? "ascending";
    this.state.activeStepIndex = -1;
    this.renderer.renderLesson(lesson);
    this.renderer.clearActiveNote();
    this.emitChange();
  }

  setTempo(bpm) {
    this.state.tempo = bpm;
    this.audioEngine?.setTempo(bpm);
    this.emitChange();
    // When using dual-clock path, AudioEngine's pump picks up the new tempo
    // automatically on the next interval — no need to restart scheduling.
    if (this.state.isPlaying && !this.audioEngine) {
      clearTimeout(this.state.timerId);
      this.state.timerId = null;
      this.scheduleNextStep();
    }
  }

  setPlaybackPattern(name) {
    const valid = ["ascending", "descending", "both"];
    if (!valid.includes(name)) return;
    if (name !== "both" && !this.lesson?.playbackPatterns?.[name]) return;
    this.state.playbackPattern = name;
    this.state.activeStepIndex = -1;
    this._scheduledStepIndex = -1;
    this.renderer.clearActiveNote();
    this.emitChange();
  }

  togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.lesson || this.state.isPlaying) return;
    this.state.isPlaying = true;
    this.emitChange();
    if (this.audioEngine) {
      this.audioEngine.start(this.state.tempo, (beatTime, beatDuration) => {
        this._advanceStep(beatTime, beatDuration);
      });
    } else {
      this.scheduleNextStep();
    }
  }

  pause() {
    if (!this.state.isPlaying) return;
    this.state.isPlaying = false;
    clearTimeout(this.state.timerId);
    this.state.timerId = null;
    this._scheduledStepIndex = -1;
    this.audioEngine?.stop();
    this.emitChange();
  }

  stop() {
    this.pause();
    this.state.activeStepIndex = -1;
    if (this.renderer) this.renderer.clearActiveNote();
    this.emitChange();
  }

  /**
   * Called by AudioEngine's onBeat callback with the precise Web Audio clock
   * time for the upcoming beat. Schedules note audio at that time and defers
   * the visual update via setTimeout so the highlight lands in sync with sound.
   */
  _advanceStep(beatTime, beatDuration) {
    if (!this.state.isPlaying) return;
    const sequence = this.getCurrentSequence();
    if (!sequence.length) return;

    let next = this._scheduledStepIndex + 1;
    if (next >= sequence.length) {
      if (this.state.loop) {
        next = 0;
      } else {
        this.stop();
        return;
      }
    }
    this._scheduledStepIndex = next;

    const noteId = sequence[next];
    const note = this.lesson.visibleNotes.find(n => n.id === noteId);
    this.audioEngine.playNote(note, beatDuration, beatTime);

    const ctx = this.audioEngine.context;
    const delayMs = (beatTime - ctx.currentTime) * 1000;
    setTimeout(() => {
      if (!this.state.isPlaying) return;
      this.state.activeStepIndex = next;
      this.renderer.setActiveNote(noteId);
      this.emitChange();
    }, Math.max(0, delayMs));
  }

  // Fallback path used when no audioEngine is present.
  nextStep() {
    const sequence = this.getCurrentSequence();
    if (!sequence.length) return;

    let nextIndex = this.state.activeStepIndex + 1;
    if (nextIndex >= sequence.length) {
      if (this.state.loop) {
        nextIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    this.state.activeStepIndex = nextIndex;
    const noteId = sequence[nextIndex];
    this.renderer.setActiveNote(noteId);
    this.emitChange();
  }

  scheduleNextStep() {
    if (!this.state.isPlaying) return;
    const msPerBeat = 60000 / this.state.tempo;
    this.nextStep();
    this.state.timerId = window.setTimeout(() => this.scheduleNextStep(), msPerBeat);
  }

  getCurrentSequence() {
    if (this.state.playbackPattern === "both") {
      // Prefer an explicit "both" sequence stored in the lesson; fall back to
      // computing ascending + descending.slice(1) for lessons that omit it.
      const stored = this.lesson?.playbackPatterns?.both;
      if (stored?.length) return stored;
      const asc  = this.lesson?.playbackPatterns?.ascending  ?? [];
      const desc = this.lesson?.playbackPatterns?.descending ?? [];
      return asc.length && desc.length ? [...asc, ...desc.slice(1)] : asc;
    }
    return this.lesson?.playbackPatterns?.[this.state.playbackPattern] ?? [];
  }

  emitChange() {
    this.onStateChange({
      lesson: this.lesson,
      state: { ...this.state }
    });
  }
}
