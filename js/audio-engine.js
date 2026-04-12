/**
 * AudioEngine
 *
 * Two responsibilities:
 *   1. Metronome click track — Web Audio lookahead scheduler (see below)
 *   2. Bass note synthesis — triggered per note step
 *
 * Why not setTimeout for timing?
 * setTimeout fires are subject to JS event loop jitter (often ±10–50ms). At
 * 80 BPM a beat is 750ms, so even small drift is audible. The Web Audio API
 * has its own high-resolution clock (AudioContext.currentTime) that runs
 * independently of the JS thread. We schedule audio events onto that clock
 * slightly ahead of time, using a short setTimeout interval only to pump the
 * scheduler — not to trigger the sound itself.
 *
 * Lookahead pattern (Chris Wilson):
 *   - lookahead (0.1s): how far ahead to schedule audio events
 *   - scheduleInterval (25ms): how often the scheduler function runs
 * The overlap gives a 75ms safety margin against JS thread latency spikes.
 */

// Open-string frequencies for standard bass tuning (EADG)
const OPEN_STRING_HZ = {
  1: 97.9989,  // G2
  2: 73.4162,  // D2
  3: 55.0000,  // A1
  4: 41.2034,  // E1
};

export class AudioEngine {
  constructor() {
    this._context = null;
    this._tempo = 80;
    this._isRunning = false;
    this._nextClickTime = 0;
    this._timerId = null;
    this._lookahead = 0.1;        // seconds
    this._scheduleInterval = 25;  // milliseconds
    this._isMuted = false;
  }

  get isMuted() { return this._isMuted; }

  // --- Metronome ---

  /** Start the metronome at the given BPM. Safe to call after a user gesture. */
  start(tempo) {
    if (this._isRunning) return;
    this._ensureContext();
    this._tempo = tempo;
    this._isRunning = true;
    this._nextClickTime = this._context.currentTime + 0.05;
    this._pump();
  }

  /** Stop the metronome. */
  stop() {
    this._isRunning = false;
    clearTimeout(this._timerId);
    this._timerId = null;
  }

  /** Update tempo while running — takes effect on the next scheduled beat. */
  setTempo(tempo) {
    this._tempo = tempo;
  }

  // --- Note synthesis ---

  /**
   * Synthesise a bass note for the given VisibleNote.
   * duration: seconds the note should sustain (typically one beat).
   * No-ops when muted.
   */
  playNote(note, duration) {
    if (this._isMuted || !note) return;
    this._ensureContext();

    const freq = this._noteToFreq(note);
    const ctx = this._context;
    const now = ctx.currentTime;

    // --- Oscillators ---
    // Sawtooth for harmonic content; sine doubled at octave below for sub warmth
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = freq;

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq / 2; // one octave down

    const sawGain = ctx.createGain();
    sawGain.gain.value = 0.45;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.55;

    // --- Low-pass filter ---
    // Starts open (bright transient) then closes quickly (warm sustain),
    // mimicking the behaviour of a plucked string
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.25);

    // --- Amplitude envelope ---
    const env = ctx.createGain();
    const safeDuration = Math.max(duration, 0.05);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.55, now + 0.004); // fast attack (4ms)
    env.gain.exponentialRampToValueAtTime(0.22, now + 0.12); // decay
    env.gain.setValueAtTime(0.22, now + safeDuration * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, now + safeDuration); // release

    // --- Routing: osc → blend → filter → envelope → output ---
    saw.connect(sawGain);
    sub.connect(subGain);
    sawGain.connect(filter);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(ctx.destination);

    const end = now + safeDuration + 0.02;
    saw.start(now);
    sub.start(now);
    saw.stop(end);
    sub.stop(end);
  }

  // --- Mute ---

  /** Toggle mute state. Returns the new muted value. */
  toggleMute() {
    this._isMuted = !this._isMuted;
    return this._isMuted;
  }

  // --- Internal ---

  _ensureContext() {
    if (!this._context) {
      this._context = new AudioContext();
    }
    if (this._context.state === "suspended") {
      this._context.resume();
    }
  }

  /** Frequency for a note given its string and fret. */
  _noteToFreq(note) {
    const openHz = OPEN_STRING_HZ[note.string];
    return openHz * Math.pow(2, note.fret / 12);
  }

  /** Pump the lookahead scheduler. */
  _pump() {
    if (!this._isRunning) return;

    while (this._nextClickTime < this._context.currentTime + this._lookahead) {
      if (!this._isMuted) this._scheduleClick(this._nextClickTime);
      this._nextClickTime += 60.0 / this._tempo;
    }

    this._timerId = setTimeout(() => this._pump(), this._scheduleInterval);
  }

  /** Synthesise a short click at the given AudioContext time. */
  _scheduleClick(time) {
    const osc = this._context.createOscillator();
    const gain = this._context.createGain();

    osc.connect(gain);
    gain.connect(this._context.destination);

    osc.frequency.value = 1000; // Hz — crisp, sits above bass register
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.start(time);
    osc.stop(time + 0.04);
  }
}
