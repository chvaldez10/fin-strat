import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const token = randomBytes(32).toString("hex");
const result = spawnSync(
  process.execPath,
  [
    "node_modules/convex/bin/main.js",
    "run",
    "invitations:issueInitial",
    JSON.stringify({ token }),
    "--deployment",
    "production",
  ],
  { encoding: "utf8" }
);
if (result.status !== 0)
  throw new Error(
    "Could not issue an initial invitation. Check the configured deployment and whether an administrator already exists."
  );
mkdirSync(".local", { recursive: true });
writeFileSync(
  ".local/initial-invitation.json",
  JSON.stringify(
    { token, path: `/register?invite=${token}`, expires: "7 days" },
    null,
    2
  ),
  { mode: 0o600 }
);
console.log(
  "Initial administrator invitation saved to ignored .local/initial-invitation.json. Open its path on your dashboard origin and create your own account."
);
