import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredAssets = [
  "public/manifest.webmanifest",
  "public/favicon.svg",
  "public/apple-touch-icon.png",
  "public/icon-192.png",
  "public/icon-512.png",
];

const requiredFirebaseFiles = [
  "firebase.json",
  "firestore.rules",
  "firestore.indexes.json",
];

const requiredEnvNames = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_SUNDESK_ALLOWED_EMAILS",
  "VITE_SUNDESK_FIRESTORE_WRITES",
];

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseEnvExample(contents) {
  const entries = new Map();

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      entries.set(trimmed, "");
      continue;
    }

    entries.set(trimmed.slice(0, equalsIndex).trim(), trimmed.slice(equalsIndex + 1).trim());
  }

  return entries;
}

function printCheck(passed, label, detail) {
  const status = passed ? "PASS" : "FAIL";
  console.log(`${status} ${label}: ${detail}`);
}

function namesDetail(missing) {
  return missing.length === 0 ? "none missing" : `missing ${missing.join(", ")}`;
}

async function checkRequiredFiles(label, files) {
  const checks = await Promise.all(files.map(async (file) => [file, await exists(file)]));
  const missing = checks.filter(([, present]) => !present).map(([file]) => file);

  printCheck(missing.length === 0, label, `${files.length - missing.length}/${files.length} present; ${namesDetail(missing)}`);

  return missing.length === 0;
}

async function checkEnvExample() {
  const envExamplePath = ".env.example";

  if (!(await exists(envExamplePath))) {
    printCheck(false, "env example", ".env.example missing");
    printCheck(false, "firestore writes default", "VITE_SUNDESK_FIRESTORE_WRITES missing");
    return false;
  }

  const contents = await readFile(path.join(root, envExamplePath), "utf8");
  const entries = parseEnvExample(contents);
  const missing = requiredEnvNames.filter((name) => !entries.has(name));
  const writesValue = entries.get("VITE_SUNDESK_FIRESTORE_WRITES") ?? "";
  const writesEnabled = writesValue.trim().toLowerCase() === "enabled";

  printCheck(
    missing.length === 0,
    "env example",
    `${requiredEnvNames.length - missing.length}/${requiredEnvNames.length} names present; ${namesDetail(missing)}`,
  );
  printCheck(
    !writesEnabled && entries.has("VITE_SUNDESK_FIRESTORE_WRITES"),
    "firestore writes default",
    entries.has("VITE_SUNDESK_FIRESTORE_WRITES") ? "not enabled" : "VITE_SUNDESK_FIRESTORE_WRITES missing",
  );

  return missing.length === 0 && !writesEnabled;
}

const checks = await Promise.all([
  checkRequiredFiles("public assets", requiredAssets),
  checkRequiredFiles("firebase config", requiredFirebaseFiles),
  checkEnvExample(),
]);

const passed = checks.every(Boolean);

printCheck(passed, "preflight", passed ? "launch files ready" : "fix failed checks");

if (!passed) {
  process.exitCode = 1;
}
