import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url)
);
function run(args) {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, "--deployment", "production"],
    { encoding: "utf8" }
  );
  if (result.status !== 0)
    throw new Error(
      "Convex configuration failed; command arguments and output are withheld because they can contain secrets."
    );
  return result.stdout;
}
const existing = run(["env", "list"]);
const hasPrivate = /^JWT_PRIVATE_KEY\s*=/m.test(existing),
  hasPublic = /^JWKS\s*=/m.test(existing);
if (hasPrivate !== hasPublic)
  throw new Error(
    "Signing configuration is incomplete. Inspect the deployment before changing keys."
  );
if (!hasPrivate) {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const privateValue = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
    .trimEnd()
    .replaceAll("\n", " ");
  const jwks = JSON.stringify({
    keys: [{ use: "sig", ...publicKey.export({ format: "jwk" }) }],
  });
  run(["env", "set", `JWT_PRIVATE_KEY=${privateValue}`]);
  run(["env", "set", `JWKS=${jwks}`]);
  console.log(
    "Configured new signing keys in the dashboard deployment (values not printed)."
  );
} else console.log("Existing signing keys preserved.");
