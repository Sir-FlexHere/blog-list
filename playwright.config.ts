import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test", quiet: true });
// One shared database is reset before each official test. Never run in parallel.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer:
    process.env.PLAYWRIGHT_EXTERNAL_SERVER === "true"
      ? undefined
      : {
          command: "node scripts/test-server.mjs",
          url: "http://localhost:3000",
          reuseExistingServer: false,
          timeout: 120_000,
        },
});
