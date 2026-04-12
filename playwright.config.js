import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
  webServer: {
    command: "python3 -m http.server 8080",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
