// lesson-schema.tsp
// TypeSpec schema for a lesson-driven bass practice player MVP.

alias InstrumentType = "bass";
alias NoteRole = "root" | "scale" | "target" | "ghost";
alias PlaybackPatternName = "ascending" | "descending";

model InstrumentConfig {
  type: InstrumentType;
  strings: uint8;
  tuning: string[];
}

model LayoutConfig {
  startFret: uint8;
  fretCount: uint8;
  showFretLabels?: boolean = true;
  fretMarkers?: uint8[];
}

model DefaultConfig {
  tempo?: uint16 = 80;
  loop?: boolean = true;
  playbackPattern?: PlaybackPatternName = "ascending";
}

model VisibleNote {
  id: string;
  string: uint8;
  fret: uint8;
  degree?: uint8;
  note?: string;
  role: NoteRole;
}

model PlaybackPatterns {
  ascending?: string[];
  descending?: string[];
}

model Lesson {
  id: string;
  title: string;
  subtitle?: string;
  instrument: InstrumentConfig;
  layout: LayoutConfig;
  defaults?: DefaultConfig;
  visibleNotes: VisibleNote[];
  playbackPatterns: PlaybackPatterns;
  instructions?: string[];
}
