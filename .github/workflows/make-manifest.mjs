#!/usr/bin/env node
// Build a Tauri updater manifest (latest.json / latest-beta.json) by scanning
// the staged release directory for signed bundle artifacts and the matching
// .sig files emitted by `tauri build`.
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

const version = arg("version");
const tag = arg("tag");
const channel = arg("channel");
const releaseDir = arg("release-dir") ?? "release";
const outDir = arg("out") ?? "release";

if (!version || !tag || !channel) {
  console.error("Missing --version, --tag, or --channel");
  process.exit(1);
}

const owner = "advenimus";
const repo = "khmtools";
const releaseTag = channel === "beta" ? "beta" : tag;
const baseUrl = `https://github.com/${owner}/${repo}/releases/download/${releaseTag}`;

function findArtifact(predicate) {
  return fs.readdirSync(releaseDir).find(predicate) ?? null;
}

function readSig(file) {
  const sigPath = path.join(releaseDir, `${file}.sig`);
  if (!fs.existsSync(sigPath)) {
    console.warn(`No .sig for ${file}`);
    return "";
  }
  return fs.readFileSync(sigPath, "utf8").trim();
}

const platforms = {};

// macOS aarch64 (.app.tar.gz from arm64 build)
const macAarch = findArtifact(
  (f) => f.endsWith(".app.tar.gz") && (f.includes("aarch64") || f.includes("arm64"))
);
if (macAarch) {
  platforms["darwin-aarch64"] = {
    signature: readSig(macAarch),
    url: `${baseUrl}/${macAarch}`,
  };
}

// macOS x86_64 (.app.tar.gz from x64 build)
const macX64 = findArtifact(
  (f) => f.endsWith(".app.tar.gz") && (f.includes("x64") || f.includes("x86_64"))
);
if (macX64) {
  platforms["darwin-x86_64"] = {
    signature: readSig(macX64),
    url: `${baseUrl}/${macX64}`,
  };
}

// Windows x86_64
const winSetup = findArtifact((f) => f.endsWith("-setup.nsis.zip"));
if (winSetup) {
  platforms["windows-x86_64"] = {
    signature: readSig(winSetup),
    url: `${baseUrl}/${winSetup}`,
  };
}

// Linux x86_64
const appImage = findArtifact((f) => f.endsWith(".AppImage.tar.gz"));
if (appImage) {
  platforms["linux-x86_64"] = {
    signature: readSig(appImage),
    url: `${baseUrl}/${appImage}`,
  };
}

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
