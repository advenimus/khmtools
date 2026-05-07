# Contributing to KHM Tools

KHM Tools is a Tauri 2 + Svelte 5 + Rust desktop app. This document covers everything you need to build, test, and contribute.

## Prerequisites

- [Rust](https://rustup.rs) (stable toolchain)
- [Node.js](https://nodejs.org) + [pnpm](https://pnpm.io)
- Tauri prerequisites for your OS — see the [Tauri docs](https://v2.tauri.app/start/prerequisites/)

## Setup

```bash
pnpm install
```

## Develop

Run the full app with hot reload:

```bash
pnpm tauri dev
```

Run only the Vite dev server in a browser (UI without Tauri APIs — `invoke()` calls will fail, but useful for pure style work):

```bash
pnpm dev
```

## Test

```bash
cargo test --manifest-path src-tauri/Cargo.toml   # Rust unit tests
pnpm check                                        # svelte-check type pass
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
```

CI runs all four on every push and pull request.

## Build

```bash
pnpm tauri build        # produces .dmg / .nsis / .AppImage in src-tauri/target/release/bundle
```

To produce updater payloads (`.app.tar.gz` + `.sig`), export the signing env vars first:

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/khmtools.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="khmtools-dev"
pnpm tauri build --bundles app,updater
```

> **macOS 26 note:** The bundled DMG script fails on macOS 26 — workaround is documented in `HANDOFF.md`.

## Release

Push a git tag to trigger the release workflow:

- `v2.0.0` → stable channel
- `v2.0.0-beta.1` → beta channel

`release.yml` builds for macOS (arm64 + x64), Windows (x64), and Linux (x64), uploads bundles to a GitHub Release, and writes a Tauri updater manifest.

### Required CI secrets

| Secret | Purpose |
|--------|---------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of `~/.tauri/khmtools.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password set when generating the key |

## Architecture

```
src/                     Svelte 5 frontend
  routes/                Dashboard, Attendance, ZoomLauncher, MediaLauncher, Settings, Onboarding
  lib/
    api.ts               typed wrapper around invoke() — single source for all IPC
    stores/              theme, toasts
    components/          Button, Card, Modal, Sidebar, ...
src-tauri/src/           Rust backend
  domain/                pure logic (attendance math, settings types, weekday parsing)
  platform/              cfg-gated: macos.rs / windows.rs / linux.rs
  commands/              Tauri command handlers (calculate_attendance, launch_*, settings, etc.)
  storage.rs             atomic JSON load/save into dirs::config_dir()/com.khmtools.app/
  updater.rs             channel resolution
```

### Storage layout

On macOS: `~/Library/Application Support/com.khmtools.app/`

| File | Contents |
|------|---------|
| `app.json` | Theme, default tool, update channel, run-at-logon |
| `meeting.json` | Meeting ID and midweek/weekend schedule |
| `paths.json` | Zoom / OBS / Media Manager path overrides |
| `media_launcher.json` | Launch toggles and custom message |
| `.onboarding_done` | Marker file — delete to re-run onboarding |
| `logs/khmtools.log.*` | Daily-rolling tracing logs |

## Key architecture rules

1. **All IPC goes through `src/lib/api.ts`** — never call `invoke()` directly from a route or component.
2. **Pure logic lives in `src-tauri/src/domain/`** — anything testable without a Tauri context. Add unit tests in the same file under `#[cfg(test)]`.
3. **Platform branches live in `src-tauri/src/platform/`**, gated by `cfg(target_os = ...)`.
4. **Settings persistence is atomic** — `storage::save_atomic()` writes to `path.tmp` then renames.
5. **No new settings files** — the four files above cover all settings domains. Ask before adding a fifth.
