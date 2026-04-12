// lesson-schema.tsp
// TypeSpec schema for a lesson-driven bass practice player MVP.

import "@typespec/json-schema";
using TypeSpec.JsonSchema;

alias InstrumentType = "bass";
alias NoteRole = "root" | "scale" | "target" | "ghost";
// Keys that can exist in PlaybackPatterns (stored sequences)
alias PlaybackPatternName = "ascending" | "descending";
// Valid player modes — includes "both" which is computed at runtime, not stored
alias PlaybackMode = PlaybackPatternName | "both";

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
  playbackPattern?: PlaybackMode = "both";
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

@jsonSchema
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
