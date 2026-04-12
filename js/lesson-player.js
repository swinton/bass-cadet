export class LessonPlayer {
  constructor({ renderer, onStateChange }) {
    this.renderer = renderer;
    this.onStateChange = onStateChange || (() => {});
    this.lesson = null;
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
    this.emitChange();
    if (this.state.isPlaying) {
      clearTimeout(this.state.timerId);
      this.state.timerId = null;
      this.scheduleNextStep();
    }
  }

  setPlaybackPattern(name) {
    if (!this.lesson?.playbackPatterns?.[name]) return;
    this.state.playbackPattern = name;
    this.state.activeStepIndex = -1;
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
    this.scheduleNextStep();
  }

  pause() {
    if (!this.state.isPlaying) return;
    this.state.isPlaying = false;
    clearTimeout(this.state.timerId);
    this.state.timerId = null;
    this.emitChange();
  }

  stop() {
    this.pause();
    this.state.activeStepIndex = -1;
    if (this.renderer) this.renderer.clearActiveNote();
    this.emitChange();
  }

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
    return this.lesson?.playbackPatterns?.[this.state.playbackPattern] ?? [];
  }

  emitChange() {
    this.onStateChange({
      lesson: this.lesson,
      state: { ...this.state }
    });
  }
}
