/**
 * AudioEngine — stub for future Web Audio API integration.
 *
 * Intended responsibilities:
 *   - Synthesize bass tones (sine/triangle wave at appropriate octave)
 *   - Trigger a note sound on each playback step
 *   - Respect mute/unmute state
 *   - Map VisibleNote data (string, fret, note name) to audio frequency
 *
 * Not yet implemented. All methods are no-ops.
 */
export class AudioEngine {
  /** Initialize the Web Audio API context. Call once on first user gesture. */
  init() {}

  /**
   * Play a tone corresponding to the given note.
   * @param {object} note - A VisibleNote object from lesson data.
   */
  playNote(_note) {}

  /** Stop any currently playing audio. */
  stop() {}

  /**
   * Set the output volume.
   * @param {number} level - Volume level between 0 (silent) and 1 (full).
   */
  setVolume(_level) {}
}
