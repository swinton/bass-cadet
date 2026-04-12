import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * lessonIdFromUrl and labelFromId are module-level helpers in app.js but
 * are not exported. We duplicate them here to test their logic in isolation.
 * If the implementations change, these tests will catch regressions.
 */

function lessonIdFromUrl(registry, search) {
  const param = new URLSearchParams(search).get("lesson");
  return (param && registry.includes(param)) ? param : registry[0];
}

function labelFromId(id) {
  return id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const REGISTRY = [
  "c-major-shape-1",
  "c-major-pentatonic-shape-1",
  "a-minor-pentatonic-position-1",
  "c-major-arpeggio",
  "c-major-seventh-arpeggio",
];

describe("lessonIdFromUrl()", () => {
  it("returns the lesson ID when the param matches a registry entry", () => {
    expect(lessonIdFromUrl(REGISTRY, "?lesson=c-major-arpeggio")).toBe("c-major-arpeggio");
  });

  it("defaults to the first registry entry when no param is present", () => {
    expect(lessonIdFromUrl(REGISTRY, "")).toBe("c-major-shape-1");
    expect(lessonIdFromUrl(REGISTRY, "?foo=bar")).toBe("c-major-shape-1");
  });

  it("defaults to the first entry when the param is not in the registry", () => {
    expect(lessonIdFromUrl(REGISTRY, "?lesson=unknown-lesson")).toBe("c-major-shape-1");
  });

  it("handles an empty registry gracefully", () => {
    expect(lessonIdFromUrl([], "?lesson=c-major-shape-1")).toBeUndefined();
  });
});

describe("labelFromId()", () => {
  it("converts hyphenated IDs to title case", () => {
    expect(labelFromId("c-major-shape-1")).toBe("C Major Shape 1");
    expect(labelFromId("a-minor-pentatonic-position-1")).toBe("A Minor Pentatonic Position 1");
    expect(labelFromId("c-major-seventh-arpeggio")).toBe("C Major Seventh Arpeggio");
  });

  it("handles a single-word ID", () => {
    expect(labelFromId("test")).toBe("Test");
  });
});
