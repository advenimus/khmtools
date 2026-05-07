# KHM Tools (Rust edition)

Cross-platform desktop app for Kingdom Hall AV operators. Tauri 2 + Svelte 5 + Rust.

## What it does

- **Start Meeting** — launches OBS, Meeting Media Manager and Zoom in sequence
- **Launch Zoom** — opens Zoom and joins your configured meeting
- **Attendance Calculator** — totals Zoom poll responses
- **Settings** — meetings, application paths, theme, update channel
- **Onboarding** — 7-step first-run wizard
- **Auto-update** — stable + beta channels via GitHub Releases

## Develop

```bash
pnpm install
pnpm tauri dev          # runs the app with hot reload
cargo test --manifest-path src-tauri/Cargo.toml
```

## Build

```bash
pnpm tauri build        # produces a .dmg / .nsis / .AppImage in src-tauri/target/release/bundle
```

## Release

Push a git tag:
- `v2.0.0` → stable channel
- `v2.0.0-beta.1` → beta channel

The `release.yml` workflow builds for macOS (arm64 + x64), Windows (x64) and Linux (x64), uploads bundles to a GitHub Release, and writes a Tauri updater manifest.

### Required secrets
- `TAURI_SIGNING_PRIVATE_KEY` — contents of `~/.tauri/khmtools.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password set when generating it

## Architecture

```
src/                     Svelte 5 frontend
  routes/                Dashboard, Attendance, ZoomLauncher, MediaLauncher, Settings, Onboarding
  lib/
    api.ts               typed wrapper around invoke()
    stores/              theme, toasts
    components/          Button, Card, Modal, Sidebar, ...
src-tauri/src/           Rust backend
  domain/                pure logic (attendance math, settings types, weekday parsing)
  platform/{macos,windows,linux}.rs   default-path detection + launch helpers
  commands/              Tauri command handlers (calculate_attendance, launch_*, settings, etc.)
  storage.rs             atomic JSON load/save into dirs::config_dir()/com.khmtools.app/
  updater.rs             channel resolution
```

Storage layout (in `~/Library/Application Support/com.khmtools.app/` on macOS):
- `app.json` — theme, default tool, update channel, run-at-logon, etc.
- `meeting.json` — meeting ID + midweek/weekend schedule
- `paths.json` — Zoom / OBS / Media Manager overrides
- `media_launcher.json` — launch toggles + custom message
- `.onboarding_done` — marker file
- `logs/khmtools.log.*` — daily-rolling tracing logs
