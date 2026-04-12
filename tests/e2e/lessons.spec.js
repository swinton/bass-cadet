import { test, expect } from "@playwright/test";

const LESSONS = [
  {
    id: "c-major-shape-1",
    title: "C Major",
    subtitle: "Shape 1",
    rootLabel: "Root (C)",
  },
  {
    id: "c-major-pentatonic-shape-1",
    title: "C Major Pentatonic",
    subtitle: "Shape 1",
    rootLabel: "Root (C)",
  },
  {
    id: "a-minor-pentatonic-position-1",
    title: "A Minor Pentatonic",
    subtitle: "Position 1",
    rootLabel: "Root (A)",
  },
  {
    id: "c-major-arpeggio",
    title: "C Major Arpeggio",
    subtitle: "C E G",
    rootLabel: "Root (C)",
  },
  {
    id: "c-major-seventh-arpeggio",
    title: "C Major Seventh Arpeggio",
    subtitle: "C E G B",
    rootLabel: "Root (C)",
  },
];

// --- Direct URL loading (bookmarkable lessons) ---

for (const lesson of LESSONS) {
  test(`loads ${lesson.id} by URL param`, async ({ page }) => {
    await page.goto(`/?lesson=${lesson.id}`);
    await expect(page.locator("#title")).toHaveText(lesson.title);
    await expect(page.locator("#subtitle")).toHaveText(lesson.subtitle);
    await expect(page.locator("#legend-root-label")).toHaveText(lesson.rootLabel);
    // Fretboard SVG should contain note circles
    await expect(page.locator("#fretboard circle.note").first()).toBeVisible();
  });
}

// --- Default load (no param) ---

test("loads the first lesson when no ?lesson= param is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#title")).toHaveText(LESSONS[0].title);
});

test("loads the first lesson for an unknown ?lesson= param", async ({ page }) => {
  await page.goto("/?lesson=does-not-exist");
  await expect(page.locator("#title")).toHaveText(LESSONS[0].title);
});

// --- Lesson dropdown ---

test("dropdown contains all lessons", async ({ page }) => {
  await page.goto("/");
  const options = page.locator("#lesson-select option");
  await expect(options).toHaveCount(LESSONS.length);
});

test("selecting a lesson from the dropdown navigates to it", async ({ page }) => {
  await page.goto("/");
  await page.selectOption("#lesson-select", "a-minor-pentatonic-position-1");
  await expect(page.locator("#title")).toHaveText("A Minor Pentatonic");
  await expect(page).toHaveURL(/lesson=a-minor-pentatonic-position-1/);
});

// --- Prev / Next navigation ---

test("Prev is disabled on the first lesson", async ({ page }) => {
  await page.goto(`/?lesson=${LESSONS[0].id}`);
  await expect(page.locator("#prev-btn")).toBeDisabled();
  await expect(page.locator("#next-btn")).toBeEnabled();
});

test("Next is disabled on the last lesson", async ({ page }) => {
  await page.goto(`/?lesson=${LESSONS.at(-1).id}`);
  await expect(page.locator("#next-btn")).toBeDisabled();
  await expect(page.locator("#prev-btn")).toBeEnabled();
});

test("Next navigates to the second lesson and updates the URL", async ({ page }) => {
  await page.goto(`/?lesson=${LESSONS[0].id}`);
  await page.click("#next-btn");
  await expect(page.locator("#title")).toHaveText(LESSONS[1].title);
  await expect(page).toHaveURL(new RegExp(`lesson=${LESSONS[1].id}`));
});

// --- Browser back / forward ---

test("browser back returns to the previous lesson", async ({ page }) => {
  await page.goto(`/?lesson=${LESSONS[0].id}`);
  await page.click("#next-btn");
  await expect(page.locator("#title")).toHaveText(LESSONS[1].title);
  await page.goBack();
  await expect(page.locator("#title")).toHaveText(LESSONS[0].title);
});

// --- Page title ---

test("page title includes the app name", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Bass Cadet/);
});
