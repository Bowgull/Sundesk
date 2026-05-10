import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const execFileAsync = promisify(execFile);

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

const requiredManifestFields = [
  "name",
  "short_name",
  "start_url",
  "scope",
  "display",
  "background_color",
  "theme_color",
];

const requiredManifestIcons = [
  {
    src: "/favicon.svg",
    sizes: "any",
    type: "image/svg+xml",
  },
  {
    src: "/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purposeIncludes: ["any", "maskable"],
  },
  {
    src: "/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purposeIncludes: ["any", "maskable"],
  },
];

const requiredIndexLinks = [
  {
    label: "manifest",
    pattern: /<link\b(?=[^>]*\brel=["']manifest["'])(?=[^>]*\bhref=["']\/manifest\.webmanifest["'])[^>]*>/i,
  },
  {
    label: "favicon",
    pattern: /<link\b(?=[^>]*\brel=["']icon["'])(?=[^>]*\bhref=["']\/favicon\.svg["'])[^>]*>/i,
  },
  {
    label: "apple-touch-icon",
    pattern: /<link\b(?=[^>]*\brel=["']apple-touch-icon["'])(?=[^>]*\bhref=["']\/apple-touch-icon\.png["'])[^>]*>/i,
  },
];

const requiredFirestoreRuleSnippets = [
  {
    label: "allowlisted helper",
    snippet: `function isAllowedUser() {
      return hasSignedInEmail()
        && exists(/databases/$(database)/documents/allowedUsers/$(request.auth.token.email));
    }`,
  },
  {
    label: "allowedUsers client write deny",
    snippet: `match /allowedUsers/{email} {
      allow get: if hasSignedInEmail() && request.auth.token.email == email;
      allow list, create, update, delete: if false;
    }`,
  },
  {
    label: "fixed workspace root",
    snippet: `match /workspaces/lindsay-sundesk {
      allow read, write: if isAllowedUser();`,
  },
  {
    label: "fixed workspace descendants",
    snippet: `match /{document=**} {
        allow read, write: if isAllowedUser();
      }`,
  },
  {
    label: "deny-all fallback",
    snippet: `match /{document=**} {
      allow read, write: if false;
    }`,
  },
];

const fixedFirestoreWorkspacePath = "lindsay-sundesk";
const finalDenyAllFallbackPattern = new RegExp(
  [
    "match\\s+\\/\\{document=\\*\\*\\}\\s*\\{",
    "\\s*allow\\s+read,\\s*write:\\s*if\\s+false;",
    "\\s*\\}\\s*\\}\\s*\\}\\s*$",
  ].join(""),
);

const forbiddenEmail = ["lindsaybelldesign", "gmail.com"].join("@");
const forbiddenEmailScanRoots = ["docs", "apps-script", "src"];
const forbiddenEmailScanExtensions = new Set([
  ".css",
  ".gs",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
]);

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseJson(contents) {
  try {
    return [JSON.parse(contents), null];
  } catch (error) {
    return [null, error];
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function normalizeRules(contents) {
  return contents.replace(/\s+/g, " ").trim();
}

function getUnexpectedWorkspaceMatches(contents) {
  return Array.from(contents.matchAll(/match\s+\/workspaces\/([^\s{]+|\{[^}]+\})/g))
    .map((match) => match[1])
    .filter((workspacePath) => workspacePath !== fixedFirestoreWorkspacePath);
}

function hasManifestIcon(icons, requiredIcon) {
  return icons.some((icon) => {
    if (!isPlainObject(icon)) {
      return false;
    }

    if (icon.src !== requiredIcon.src || icon.sizes !== requiredIcon.sizes || icon.type !== requiredIcon.type) {
      return false;
    }

    if (!requiredIcon.purposeIncludes) {
      return true;
    }

    const purposeParts = typeof icon.purpose === "string" ? icon.purpose.split(/\s+/).filter(Boolean) : [];

    return requiredIcon.purposeIncludes.every((purpose) => purposeParts.includes(purpose));
  });
}

async function checkRequiredFiles(label, files) {
  const checks = await Promise.all(files.map(async (file) => [file, await exists(file)]));
  const missing = checks.filter(([, present]) => !present).map(([file]) => file);

  printCheck(missing.length === 0, label, `${files.length - missing.length}/${files.length} present; ${namesDetail(missing)}`);

  return missing.length === 0;
}

async function checkManifest() {
  const manifestPath = "public/manifest.webmanifest";

  if (!(await exists(manifestPath))) {
    printCheck(false, "manifest json", `${manifestPath} missing`);
    printCheck(false, "manifest fields", "manifest unavailable");
    printCheck(false, "manifest icons", "manifest unavailable");
    return false;
  }

  const contents = await readFile(path.join(root, manifestPath), "utf8");
  const [manifest, parseError] = parseJson(contents);

  printCheck(!parseError && isPlainObject(manifest), "manifest json", parseError ? "invalid JSON" : "valid object");

  if (parseError || !isPlainObject(manifest)) {
    printCheck(false, "manifest fields", "manifest unavailable");
    printCheck(false, "manifest icons", "manifest unavailable");
    return false;
  }

  const missingFields = requiredManifestFields.filter((field) => typeof manifest[field] !== "string" || manifest[field].trim() === "");
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const missingIcons = requiredManifestIcons
    .filter((requiredIcon) => !hasManifestIcon(icons, requiredIcon))
    .map((requiredIcon) => requiredIcon.src);

  printCheck(
    missingFields.length === 0,
    "manifest fields",
    `${requiredManifestFields.length - missingFields.length}/${requiredManifestFields.length} present; ${namesDetail(missingFields)}`,
  );
  printCheck(
    missingIcons.length === 0,
    "manifest icons",
    `${requiredManifestIcons.length - missingIcons.length}/${requiredManifestIcons.length} present; ${namesDetail(missingIcons)}`,
  );

  return missingFields.length === 0 && missingIcons.length === 0;
}

async function checkIndexLinks() {
  const indexPath = "index.html";

  if (!(await exists(indexPath))) {
    printCheck(false, "index pwa links", "index.html missing");
    return false;
  }

  const contents = await readFile(path.join(root, indexPath), "utf8");
  const missingLinks = requiredIndexLinks.filter((link) => !link.pattern.test(contents)).map((link) => link.label);

  printCheck(
    missingLinks.length === 0,
    "index pwa links",
    `${requiredIndexLinks.length - missingLinks.length}/${requiredIndexLinks.length} present; ${namesDetail(missingLinks)}`,
  );

  return missingLinks.length === 0;
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

async function checkFirestoreRulesSafety() {
  const rulesPath = "firestore.rules";

  if (!(await exists(rulesPath))) {
    printCheck(false, "firestore rules safety", "firestore.rules missing");
    return false;
  }

  const contents = await readFile(path.join(root, rulesPath), "utf8");
  const normalizedRules = normalizeRules(contents);
  const missing = requiredFirestoreRuleSnippets
    .filter((item) => !normalizedRules.includes(normalizeRules(item.snippet)))
    .map((item) => item.label);
  const unexpectedWorkspaceMatches = getUnexpectedWorkspaceMatches(contents);
  const hasFinalDenyAllFallback = finalDenyAllFallbackPattern.test(contents.trim());
  const passed = missing.length === 0 && unexpectedWorkspaceMatches.length === 0 && hasFinalDenyAllFallback;
  const detailParts = [
    `${requiredFirestoreRuleSnippets.length - missing.length}/${requiredFirestoreRuleSnippets.length} snippets present`,
    namesDetail(missing),
    hasFinalDenyAllFallback ? "final deny-all fallback" : "deny-all fallback is not final",
  ];

  if (unexpectedWorkspaceMatches.length > 0) {
    detailParts.push(`unexpected workspaces: ${unexpectedWorkspaceMatches.join(", ")}`);
  }

  printCheck(passed, "firestore rules safety", detailParts.join("; "));

  return passed;
}

async function listTrackedTextFiles() {
  let stdout = "";

  try {
    ({ stdout } = await execFileAsync("git", ["ls-files", ...forbiddenEmailScanRoots], {
      cwd: root,
      maxBuffer: 1024 * 1024 * 8,
    }));
  } catch {
    return null;
  }

  return stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => forbiddenEmailScanExtensions.has(path.extname(file)))
    .sort((a, b) => a.localeCompare(b));
}

async function checkForbiddenEmail() {
  const files = await listTrackedTextFiles();

  if (!files) {
    printCheck(false, "forbidden real email", "git tracked file list unavailable");
    return false;
  }

  const matches = [];

  for (const file of files) {
    const contents = await readFile(path.join(root, file), "utf8");

    if (contents.includes(forbiddenEmail)) {
      matches.push(file);
    }
  }

  printCheck(
    matches.length === 0,
    "forbidden real email",
    matches.length === 0 ? `${files.length} tracked text files scanned; none found` : `found in ${matches.join(", ")}`,
  );

  return matches.length === 0;
}

const checks = [];

checks.push(await checkRequiredFiles("public assets", requiredAssets));
checks.push(await checkRequiredFiles("firebase config", requiredFirebaseFiles));
checks.push(await checkManifest());
checks.push(await checkIndexLinks());
checks.push(await checkEnvExample());
checks.push(await checkFirestoreRulesSafety());
checks.push(await checkForbiddenEmail());

const passed = checks.every(Boolean);

printCheck(passed, "preflight", passed ? "launch files ready" : "fix failed checks");

if (!passed) {
  process.exitCode = 1;
}
