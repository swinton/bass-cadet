/**
 * AudioEngine — metronome click using the Web Audio API lookahead scheduler.
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
export class AudioEngine {
  constructor() {
    this._context = null;
    this._tempo = 80;
    this._isRunning = false;
    this._nextClickTime = 0;
    this._timerId = null;
    this._lookahead = 0.1;        // seconds
    this._scheduleInterval = 25;  // milliseconds
  }

  /** Start the metronome at the given BPM. Safe to call after a user gesture. */
  start(tempo) {
    if (this._isRunning) return;
    this._ensureContext();
    this._tempo = tempo;
    this._isRunning = true;
    // Start slightly in the future so the first click isn't clipped
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

  // --- Internal ---

  _ensureContext() {
    if (!this._context) {
      this._context = new AudioContext();
    }
    if (this._context.state === "suspended") {
      this._context.resume();
    }
  }

  /** Scheduler: runs every _scheduleInterval ms, scheduling any clicks that
   *  fall within the lookahead window onto the Web Audio clock. */
  _pump() {
    if (!this._isRunning) return;

    while (this._nextClickTime < this._context.currentTime + this._lookahead) {
      this._scheduleClick(this._nextClickTime);
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
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04); // 40ms decay

    osc.start(time);
    osc.stop(time + 0.04);
  }
}
