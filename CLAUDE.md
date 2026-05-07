# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

KHM Tools — Tauri 2 + Svelte 5 + Rust desktop app for Kingdom Hall AV operators. Replaces the previous Electron version (which lives on `main`; the rewrite lives on `rust-rewrite`). Five jobs: launch Zoom, run a meeting-launch sequence (OBS → M³ → Zoom), calculate Zoom-poll attendance, walk first-run users through onboarding, auto-update from GitHub Releases.

Bundle size: ~6.6 MB `.app` / ~3.4 MB `.dmg` (vs ~150 MB for the Electron version).

## Stack

- **Shell**: Tauri 2.x (Rust core + native webview, not Electron)
- **Frontend**: Svelte 5 (runes mode, `$state` / `$props` / `$derived`) + TypeScript + Tailwind v3 + Vite 5
- **Backend**: Rust 2021, async Tauri commands, `serde_json` for storage, `opener` for protocol URLs, `auto-launch` for login items, `tracing` for logs
- **Updater**: `tauri-plugin-updater` with runtime endpoint switching for stable/beta channels
- **Package manager**: pnpm (use it, not npm — `package.json` lockfile is `pnpm-lock.yaml`)

## Common commands

```bash
# Run
pnpm tauri dev                                              # full app, hot reload
pnpm dev                                                    # Vite only (UI without Tauri)

# Test / lint
cargo test --manifest-path src-tauri/Cargo.toml             # 12 Rust unit tests
pnpm check                                                  # svelte-check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo fmt --manifest-path src-tauri/Cargo.toml --all

# Build
pnpm tauri build                                            # release bundle
pnpm tauri build --bundles app,updater                      # also writes .app.tar.gz + .sig
```

Updater payloads need these env vars (in shell or `.env.local`):
- `TAURI_SIGNING_PRIVATE_KEY` — contents of `~/.tauri/khmtools.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — `khmtools-dev` (placeholder; rotate before public release)

## Layout

```
src/                     Svelte frontend
  App.svelte             routes through router state, mounts Onboarding when needed
  main.ts                bootstrap + theme init
  app.css                CSS-variable theme tokens (light/dark/system) + Tailwind layers
  lib/
    api.ts               typed wrapper around Tauri invoke() — single source for all IPC
    router.ts            tiny hash-based router (no deps)
    stores/              theme, toasts (Svelte stores from svelte/store)
    components/          shared UI (Button, Card, Modal, TopBar, Sidebar, ...)
  routes/                one Svelte file per screen (Dashboard, Attendance, ZoomLauncher,
                         MediaLauncher, Settings, Onboarding)
src-tauri/               Rust backend
  Cargo.toml             deps + release profile (lto, opt=s, panic=abort, strip)
  tauri.conf.json        bundle id (com.khmtools.app), updater pubkey, NSIS/DMG config
  capabilities/          Tauri 2 capability/permission declarations
  src/
    main.rs              tiny entry that calls khmtools_lib::run()
    lib.rs               Tauri builder, plugin registration, command registration, tracing init
    error.rs             AppError + AppResult
    storage.rs           atomic JSON I/O in dirs::config_dir()/com.khmtools.app/
    domain/              pure logic — attendance math, settings types, weekday parsing
    platform/            cfg-gated: macos.rs / windows.rs / linux.rs
    commands/            #[tauri::command] handlers — every IPC endpoint lives here
.github/workflows/
  ci.yml                 fmt + clippy + tests + frontend build (every push/PR)
  release.yml            tag-driven cross-platform releases
  make-manifest.mjs      builds latest.json from signed bundles
```

## Architecture rules

1. **All IPC goes through `src/lib/api.ts`** — never call `invoke()` directly from a route or component. If you add a Tauri command, also add its typed wrapper to `api.ts` so the frontend stays type-safe.
2. **Pure logic lives in `src-tauri/src/domain/`** — anything testable without a Tauri context. Add unit tests in the same file under `#[cfg(test)]`. The 12 existing tests are the floor; don't ship new logic without tests.
3. **Platform branches live in `src-tauri/src/platform/`**, gated by `cfg(target_os = ...)`. Don't sprinkle `#[cfg]` through commands — call into the platform module.
4. **Settings persistence is atomic** — `storage::save_atomic()` writes to `path.tmp` then renames. Don't bypass it with raw `fs::write` for config files.
5. **Don't introduce new JSON files for settings** — the four files are `app.json`, `meeting.json`, `paths.json`, `media_launcher.json`. If a setting doesn't fit one of those domains, ask before adding a fifth.

## Theming

- Tokens in `src/app.css` under `[data-theme="light"]` / `[data-theme="dark"]`. System mode uses `@media (prefers-color-scheme)` to swap.
- New components must reference tokens (`var(--bg)`, `var(--text)`, `var(--brand)`, etc.) — **never hard-code colors**. Tailwind classes like `bg-bg`, `text-text`, `text-text-mute`, `border-border` already wrap these.
- Brand color is the logo's royal blue `#2563EB` (light) / `#3B82F6` (dark). Don't introduce new accent colors without a design reason.

## Auto-update

Two endpoints, picked at runtime in `commands/update.rs::endpoint_for_channel()`:
- Stable: `https://github.com/advenimus/khmtools/releases/latest/download/latest.json`
- Beta: `https://github.com/advenimus/khmtools/releases/download/beta/latest-beta.json`

Channel is read fresh on every check, so toggling stable ↔ beta in Settings takes effect without a restart. Update payloads are minisign-signed (Tauri's mechanism, separate from OS code-signing). Public key is in `tauri.conf.json`; private key + password are CI secrets.

## Releasing

Tag pattern decides the channel:
- `v2.0.0` → stable
- `v2.0.0-beta.1` → beta

`release.yml` builds the matrix, the `make-manifest.mjs` step assembles `latest.json` (or `latest-beta.json`) from the signed `.tar.gz` artifacts, and `gh release create` does the rest. Beta tags additionally force-recreate the moving `beta` release so the endpoint URL keeps resolving.

## Known traps

- **Tauri's `bundle_dmg.sh` fails on macOS 26** — there's a manual `hdiutil` workaround in `HANDOFF.md`. CI on macOS 14 is fine.
- **`com.khmtools.app` identifier ends with `.app`** — Tauri prints a warning. If renaming, update both `tauri.conf.json` and `storage::APP_DIR` and migrate user data.
- **macOS code-signing is ad-hoc** by default. Don't reuse the Conduit `JBTB5G7DRQ` cert from global rules — different project. Notarization path documented in `HANDOFF.md`.
- **Don't commit `node_modules/` or `src-tauri/target/`** — both are in `.gitignore`. The original Electron repo had `node_modules` checked in; the rewrite explicitly does not.

## Coding style notes specific to this repo

- Svelte 5 runes (`$state`, `$props`, `$bindable`, `$derived`) — not legacy `let`-reactive syntax. New components must use runes.
- Rust: prefer `format!("…{var}…")` over positional args (clippy `uninlined_format_args` is enforced).
- No `unwrap()` / `expect()` outside tests and a single `expect("error while running tauri application")` in `lib.rs`. Error-path code returns `AppResult<T>` (serializes nicely to the frontend).
- Keep handlers in `commands/*.rs` short — anything past ~20 lines should be moved into `domain/` or `platform/`.
- Default to no comments. Only annotate non-obvious *why*. Identifier choice should make *what* obvious.

## Files Claude shouldn't modify lightly

- `tauri.conf.json` updater pubkey — changing it breaks every installed user's update path
- `src-tauri/src/storage.rs::APP_DIR` — changing it strands existing user data
- `domain/attendance.rs` — every change needs a corresponding unit test, the math is the product

## Migration from Electron version

If a user runs the Rust build with the old Electron config files still present in their data dir, settings won't auto-migrate. The plan called for a `storage::migrate_from_electron()` shim; if it ever becomes a real concern, that's the file to add.
