const SVG_NS = "http://www.w3.org/2000/svg";

// Geometry constants matching the static mockup (viewBox 0 0 1180 390)
const G = {
  railTop: 52,
  railBottom: 338,
  nut: { x: 20, y: 48, width: 24, height: 294 },
  stringLeft: 44,
  stringRight: 1158,
  fretTop: 58,
  fretBottom: 332,
  fretLeft: 300,
  fretRight: 1140,
  stringTop: 78,
  stringBottom: 318,
  noteRadius: 22,
  markerRadius: 20,
  // y-midpoint between string 2 (D) and string 3 (A) — standard bass neck inlay row
  markerY: 198
};

export class FretboardRenderer {
  constructor({ svgEl, labelsEl }) {
    this.svgEl = svgEl;
    this.labelsEl = labelsEl;
    this.lesson = null;
    this.uniqueFrets = [];
    this.wires = [];
  }

  // --- Public API ---

  renderLesson(lesson) {
    this.lesson = lesson;
    this.uniqueFrets = this._getUniqueFrets(lesson);
    this.wires = this._getFretWires(this.uniqueFrets);
    this.clear();
    this._drawFrame(lesson);
    this._drawFretMarkers(lesson);
    this._drawNotes(lesson);
  }

  clear() {
    while (this.svgEl.firstChild) {
      this.svgEl.removeChild(this.svgEl.firstChild);
    }
  }

  setActiveNote(noteId) {
    this.clearActiveNote();
    const el = this.svgEl.querySelector(`[data-note-id="${noteId}"]`);
    if (el) el.classList.add("active");
  }

  clearActiveNote() {
    const active = this.svgEl.querySelector(".note.active");
    if (active) active.classList.remove("active");
  }

  // --- Geometry helpers ---

  _getUniqueFrets(lesson) {
    const { startFret, fretCount } = lesson.layout;
    return Array.from({ length: fretCount }, (_, i) => startFret + i);
  }

  // Produces N+1 equally-spaced wires for N unique fret columns
  _getFretWires(uniqueFrets) {
    const spacing = (G.fretRight - G.fretLeft) / uniqueFrets.length;
    return Array.from({ length: uniqueFrets.length + 1 }, (_, i) => G.fretLeft + i * spacing);
  }

  // x-center of the column for a given fret number
  _getFretColumnX(fret) {
    const i = this.uniqueFrets.indexOf(fret);
    return (this.wires[i] + this.wires[i + 1]) / 2;
  }

  // y-position for a given string (TAB convention: string 1 = G = top)
  _getStringY(string, stringCount) {
    const spacing = (G.stringBottom - G.stringTop) / (stringCount - 1);
    return G.stringTop + (string - 1) * spacing;
  }

  // --- Drawing ---

  _drawFrame(lesson) {
    const { strings } = lesson.instrument;

    // Top and bottom rails
    this._line("rail", G.stringLeft, G.railTop,  G.stringRight, G.railTop);
    this._line("rail", G.stringLeft, G.railBottom, G.stringRight, G.railBottom);

    // Nut
    this._rect("nut", G.nut.x, G.nut.y, G.nut.width, G.nut.height, 3);

    // Strings (string 1 = thinnest at top, string 4 = thickest at bottom)
    for (let s = 1; s <= strings; s++) {
      const y = this._getStringY(s, strings);
      const line = this._line(`string s${s}`, G.stringLeft, y, G.stringRight, y);
      line.setAttribute("stroke-width", 3 + s);
    }

    // Fret wires
    for (const x of this.wires) {
      this._line("fret", x, G.fretTop, x, G.fretBottom);
    }
  }

  _drawFretMarkers(lesson) {
    const markers = lesson.layout?.fretMarkers ?? [];
    for (const fret of markers) {
      if (!this.uniqueFrets.includes(fret)) continue;
      const cx = this._getFretColumnX(fret);
      this._circle("note ghost", cx, G.markerY, G.markerRadius);
    }
  }

  _drawNotes(lesson) {
    const { strings } = lesson.instrument;
    for (const note of lesson.visibleNotes) {
      const cx = this._getFretColumnX(note.fret);
      const cy = this._getStringY(note.string, strings);
      const cls = note.role === "root" ? "note root" : "note";
      const circle = this._circle(cls, cx, cy, G.noteRadius);
      circle.setAttribute("data-note-id", note.id);
    }
  }

  // --- SVG element factories ---

  _line(className, x1, y1, x2, y2) {
    const el = document.createElementNS(SVG_NS, "line");
    el.setAttribute("class", className);
    el.setAttribute("x1", x1);
    el.setAttribute("y1", y1);
    el.setAttribute("x2", x2);
    el.setAttribute("y2", y2);
    this.svgEl.appendChild(el);
    return el;
  }

  _rect(className, x, y, width, height, rx = 0) {
    const el = document.createElementNS(SVG_NS, "rect");
    el.setAttribute("class", className);
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    el.setAttribute("width", width);
    el.setAttribute("height", height);
    if (rx) el.setAttribute("rx", rx);
    this.svgEl.appendChild(el);
    return el;
  }

  _circle(className, cx, cy, r) {
    const el = document.createElementNS(SVG_NS, "circle");
    el.setAttribute("class", className);
    el.setAttribute("cx", cx);
    el.setAttribute("cy", cy);
    el.setAttribute("r", r);
    this.svgEl.appendChild(el);
    return el;
  }
}
