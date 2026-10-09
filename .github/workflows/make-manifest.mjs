#!/usr/bin/env node
// Build a Tauri updater manifest (latest.json / latest-beta.json) from the
// staged, signed release files. Fails the release if any platform or
// signature is missing, so a broken manifest can never be published.
//
// Usage:
//   node make-manifest.mjs --version 2.0.0 --tag v2.0.0 --channel stable \
//     --release-dir release --out release

import fs from "node:fs";
import path from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  return process.argv[i + 1] ?? null;
}

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

const version = arg("version");
const tag = arg("tag");
const channel = arg("channel");
const releaseDir = arg("release-dir") ?? "release";
const outDir = arg("out") ?? "release";

if (!version || !tag || !channel) fail("Missing --version, --tag, or --channel");

const owner = "advenimus";
const repo = "khmtools";
const releaseTag = channel === "beta" ? "beta" : tag;
const baseUrl = `https://github.com/${owner}/${repo}/releases/download/${releaseTag}`;

// Tauri 2 signs the installers themselves (no .zip / .tar.gz wrapper) except
// on macOS, where the updater payload is the .app.tar.gz.
const PLATFORMS = {
  "darwin-aarch64": (f) => f.endsWith(".app.tar.gz"),
  "windows-x86_64": (f) => f.endsWith("-setup.exe"),
  "linux-x86_64": (f) => f.endsWith(".AppImage"),
};

const files = fs.readdirSync(releaseDir);

function entryFor(platform, matches) {
  const found = files.filter(matches);
  if (found.length !== 1) fail(`${platform}: expected 1 updater file, found ${found.length} (${found.join(", ")})`);
  const file = found[0];
  const sigPath = path.join(releaseDir, `${file}.sig`);
  if (!fs.existsSync(sigPath)) fail(`${platform}: ${file}.sig is missing`);
  const signature = fs.readFileSync(sigPath, "utf8").trim();
  if (!signature) fail(`${platform}: ${file}.sig is empty`);
  return { signature, url: `${baseUrl}/${encodeURIComponent(file)}` };
}

const platforms = Object.fromEntries(
  Object.entries(PLATFORMS).map(([platform, matches]) => [platform, entryFor(platform, matches)])
);

const manifest = {
  version,
  notes: `Release ${tag}`,
  pub_date: new Date().toISOString(),
  platforms,
};

const fileName = channel === "beta" ? "latest-beta.json" : "latest.json";
const outPath = path.join(outDir, fileName);
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(manifest, null, 2));
