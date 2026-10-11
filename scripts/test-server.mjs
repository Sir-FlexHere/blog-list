import { spawn } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true, quiet: true });
if (!process.env.DATABASE_URL || process.env.ALLOW_TEST_RESET !== "true") {
  throw new Error(
    "Configure .env.test with an isolated DATABASE_URL and ALLOW_TEST_RESET=true before running destructive E2E tests.",
  );
}
const compilerFlags =
  process.env.NEXT_TEST_WEBPACK === "true" ? ["--webpack"] : [];
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    ...compilerFlags,
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
