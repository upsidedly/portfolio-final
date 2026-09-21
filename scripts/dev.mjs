import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import "./prepare-tools.mjs";

if (existsSync(".env")) loadEnvFile(".env");
const args = process.argv.slice(2);
const configuredPort =
  process.env.PORT ||
  new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").port ||
  "3000";
const hasPort = args.some(
  (arg) => arg === "-p" || arg === "--port" || arg.startsWith("--port="),
);
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--turbo",
    ...(!hasPort ? ["--port", configuredPort] : []),
    ...args,
  ],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
