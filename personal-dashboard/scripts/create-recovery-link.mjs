import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("Usage: node scripts/create-recovery-link.mjs account-email");
const token = randomBytes(32).toString("hex");
const result = spawnSync(
  process.execPath,
  [
    "node_modules/convex/bin/main.js",
    "run",
    "invitations:issueRecovery",
    JSON.stringify({ token, email }),
    "--deployment",
    "production",
  ],
  { encoding: "utf8" }
);
if (result.status !== 0)
  throw new Error(
    "Recovery link could not be created. Check the configured deployment and account email."
  );
mkdirSync(".local", { recursive: true });
writeFileSync(
  ".local/recovery-link.json",
  JSON.stringify(
    {
      path: `/recover?token=${token}&email=${encodeURIComponent(email)}`,
      expires: "1 hour",
    },
    null,
    2
  ),
  { mode: 0o600 }
);
console.log(
  "Private recovery link saved to ignored .local/recovery-link.json."
);
