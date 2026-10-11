import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test", quiet: true });
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    // Deliberately enable the test flag to prove production always rejects it.
    env: { ...process.env, NODE_ENV: "production", ALLOW_TEST_RESET: "true" },
  },
);
let logs = "";
child.stdout.on("data", (data) => {
  logs += data;
});
child.stderr.on("data", (data) => {
  logs += data;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error("Production server exited before verification. " + logs);
    try {
      if ((await fetch("http://127.0.0.1:3001/api/me")).status === 401) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for startup. */
    }
    await delay(200);
  }
  assert.ok(ready, "Production server did not start");
  const reset = await fetch("http://127.0.0.1:3001/api/testing/reset", {
    method: "DELETE",
  });
  const create = await fetch("http://127.0.0.1:3001/api/testing/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "never-created",
      name: "Never Created",
      password: "not-used",
    }),
  });
  assert.equal(reset.status, 403);
  assert.equal(create.status, 403);
  const home = await fetch("http://127.0.0.1:3001/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Good ideas deserve a place/);
  console.log(
    "Production checks passed: testing reset=403, testing users=403, missing API token=401, MDX homepage=200.",
  );
} finally {
  child.kill();
}
