# Handoff — KHM Tools Rust rewrite

## What's built

**Worktree:** `/Users/chris/Github/khmtools-rs` on branch `rust-rewrite`
**Old Electron source:** untouched on `main`

```
khmtools-rs/
├── src/                              Svelte 5 + TypeScript frontend
│   ├── App.svelte
│   ├── app.css                       theme tokens (light/dark/system)
│   ├── main.ts
│   ├── lib/
│   │   ├── api.ts                    typed wrapper around Tauri invoke()
│   │   ├── router.ts                 hash-based router
│   │   ├── stores/{theme,toasts}.ts
│   │   └── components/               Button, Card, Modal, Sidebar, TopBar, etc.
│   └── routes/                       Dashboard, Attendance, ZoomLauncher,
│                                     MediaLauncher, Settings, Onboarding
├── src-tauri/                        Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── lib.rs                    builds Tauri app, registers commands
│       ├── error.rs
│       ├── storage.rs                atomic JSON I/O
│       ├── domain/
│       │   ├── attendance.rs         pure: poll → total (7 unit tests)
│       │   ├── meeting_schedule.rs   weekday parsing/matching (2 tests)
│       │   └── settings.rs           types + serde (2 tests)
│       ├── platform/
│       │   ├── macos.rs              `open -a` launcher
│       │   ├── windows.rs            CREATE_NO_WINDOW launcher, OBS virtcam flag
│       │   └── linux.rs              direct exec
│       └── commands/                 every Tauri #[command] (attendance,
│                                     launcher, settings, onboarding,
│                                     auto_launch, update, misc)
└── .github/workflows/
    ├── release.yml                   tag-driven cross-platform releases
    ├── ci.yml                        fmt + clippy + tests + frontend build
    └── make-manifest.mjs             builds latest.json for the updater
```

## Local build artifacts

- `src-tauri/target/release/bundle/macos/KHM Tools.app` — 6.6 MB, arm64, ad-hoc signed (local builds only — CI releases are Developer ID signed + notarized)
- `src-tauri/target/release/bundle/dmg/KHM Tools_2.0.0-beta.1_arm64.dmg` — 3.4 MB
- `src-tauri/target/release/bundle/macos/KHM Tools.app.tar.gz` — 3.2 MB (updater payload)
- `src-tauri/target/release/bundle/macos/KHM Tools.app.tar.gz.sig` — minisign signature

(The Electron version was ~150 MB.)

To install: open the DMG, drag `KHM Tools.app` to `/Applications`. **Local** builds are still ad-hoc signed (right-click → Open on first launch). **CI** builds from tagged releases are Developer ID signed + notarized — see [macOS code signing](#macos-code-signing) below.

## Verified

| Check | Result |
|---|---|
| `cargo test` | ✓ 12 / 12 pass |
| `cargo clippy --all-targets -- -D warnings` | ✓ clean |
| `cargo fmt --check` | ✓ clean |
| `pnpm check` (svelte-check) | ✓ 234 files, 0 errors, 0 warnings |
| `pnpm build` (frontend) | ✓ 97 KB JS / 16 KB CSS, gzipped ≈ 36 KB |
| `pnpm tauri build` | ✓ produced .app bundle (DMG step had to be redone manually with `hdiutil` because Tauri's `bundle_dmg.sh` is failing on macOS 26 — recipe in [Known issues](#known-issues) below) |
| App launches | ✓ process started, log file written: `~/Library/Application Support/com.khmtools.app/logs/khmtools.log.2026-05-07` |
| Update check on startup | ✓ runs (fails gracefully because no GitHub release exists yet — expected) |

## Not verified (your turn)

I couldn't take screenshots — macOS 26's privacy controls block `screencapture` and `osascript` from this terminal session, and the Playwright MCP disconnected before I could mock-load the UI in a browser. Visual UI verification is on you. Specifically, please run through:

1. First-launch onboarding wizard (steps 1–7)
2. Theme toggle: Light / Dark / System — every screen rerenders cleanly
3. Attendance calculator (e.g. 1×3, 2×2, phone×1 → 8)
4. Zoom launcher with valid + missing meeting ID
5. Media Launcher full sequence with all toggles on, then with two off
6. Settings → Reset all settings → confirms onboarding reappears next launch
7. Settings → Updates → channel toggle stable ↔ beta works

If any tool actually misbehaves I'll fix it.

I also haven't tested **Windows / Linux runtime** — only `cargo` cross-checks would have meant pulling those toolchains. Those need the CI run or a Windows/Linux machine. The CI workflow at `.github/workflows/release.yml` is set up to build for both.

## How auto-update is wired

Two endpoints, picked at runtime per the user's `update_channel` setting (no restart needed):

- Stable: `https://github.com/advenimus/khmtools/releases/latest/download/latest.json`
- Beta:   `https://github.com/advenimus/khmtools/releases/download/beta/latest-beta.json`

The Settings → Updates page lets the user switch channels and triggers a confirm dialog when picking beta. The top-of-window banner appears whenever an update is available; clicking "Install & restart" runs `download_and_install` → `app.restart()`.

Update payloads are signed by Tauri's minisign keypair (orthogonal to OS code-signing). The keypair I generated is at:

- Public (committed in `tauri.conf.json`): `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDM3NzZBQzdGRDgxRTRGQTgKUldTb1R4N1lmNngyTjZHWUc1Q1FScHpDbGdYVUZ6VzdvbHBxZ3V3eS94aXR2c29TQnNYVG5VK1IK`
- Private: `~/.tauri/khmtools.key` (password: `khmtools-dev` — change before any real release)

## CI/CD release flow

Push a git tag and the matrix build does the rest:

| Tag | Channel | What happens |
|---|---|---|
| `v2.0.0` | stable | Builds mac arm64+x64, win x64, linux x64. Creates a GitHub release with the bundles. Writes `latest.json`. Marks "latest". |
| `v2.0.0-beta.1` | beta | Same builds. Two releases: a pinned `v2.0.0-beta.1` prerelease, and a moving `beta` release that's deleted+recreated each beta tag (so the URL above always resolves). |

Required repo secrets:
- `TAURI_SIGNING_PRIVATE_KEY` — the contents of `~/.tauri/khmtools.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password
- `GITHUB_TOKEN` — auto-provided

## Bugs deliberately fixed (vs. Electron version)

1. Onboarding wizard had inconsistent step numbering ("Step 6 of 7" vs "of 8") — single source of truth (`totalSteps = 7`) now.
2. Deprecated `customMessage` toggle removed; the popup is gated only by `display_when`.
3. The 40-line console-redirect-to-renderer monkey-patch is gone — replaced by `tracing` to a daily-rolling log file.
4. `forceDevUpdateConfig = true` (was on in production) — gone.
5. Hidden BrowserWindow Zoom-URL hack — gone, replaced by `opener::open("zoommtg://…")` which works natively on all three platforms.
6. Reset-settings race — atomic file deletion + frontend gets a fresh state on next launch.
7. `media-config.json` mixed unrelated concerns — split into `app.json`, `meeting.json`, `paths.json`, `media_launcher.json`.
8. Bundle size: 150 MB → 6.6 MB.

## Known issues

### Tauri's DMG bundler fails on macOS 26

`bundle_dmg.sh` exits non-zero (likely `hdiutil` / AppleScript permission interaction). Worked around with a one-liner that produces an equivalent DMG:

```bash
mkdir -p /tmp/khm-dmg
cp -R "/Users/chris/Github/khmtools-rs/src-tauri/target/release/bundle/macos/KHM Tools.app" /tmp/khm-dmg/
ln -s /Applications /tmp/khm-dmg/Applications
hdiutil create -volname "KHM Tools" -srcfolder /tmp/khm-dmg -ov -format UDZO -fs HFS+ "KHM Tools_2.0.0-beta.1_arm64.dmg"
```

Better fix: either add a custom bundler step in `release.yml` for macOS, or wait for Tauri upstream. CI runs on `macos-latest` (Sonoma 14) where the script does work, so this only affects local dev on macOS 26.

### `com.khmtools.app` identifier ends with `.app`

Tauri prints a warning. Doesn't break anything but recommended to change to e.g. `com.khmtools.tools` in a follow-up. Touches `tauri.conf.json` and the `APP_DIR` constant in `src-tauri/src/storage.rs`.

### macOS code signing

CI builds (tagged releases) are signed with **Developer ID Application** + hardened runtime and notarized via App Store Connect API. Local `pnpm tauri build` keeps using ad-hoc signing — `signingIdentity` in `tauri.conf.json` stays `null` and `APPLE_SIGNING_IDENTITY` is only set in CI.

**Files involved:**
- `src-tauri/tauri.conf.json` → `bundle.macOS.entitlements: "entitlements.mac.plist"`
- `src-tauri/entitlements.mac.plist` — empty dict; codesign still applies hardened runtime via the `--options runtime` flag tauri-action sets. The Electron-era `allow-jit`/`allow-unsigned-executable-memory`/etc. were V8-specific and **don't apply** to Tauri's WKWebView.
- `.github/workflows/release.yml` → "Import Apple Developer ID certificate" + "Write App Store Connect API key" steps gated on `matrix.os == 'macos-latest'`.

**Required repo secrets** (all eight are needed; macOS legs fail-fast without them):

| Secret | Source | Purpose |
|---|---|---|
| `APPLE_CERTIFICATE` | `openssl base64 -A -in DeveloperID.p12` | base64-encoded .p12 |
| `APPLE_CERTIFICATE_PASSWORD` | password set at .p12 export | unlocks the .p12 |
| `APPLE_SIGNING_IDENTITY` | `security find-identity -v -p codesigning` (the quoted string) | full identity, e.g. `Developer ID Application: Chris Vautour (XXXXXXXXXX)` |
| `KEYCHAIN_PASSWORD` | any random string | password for the throwaway CI keychain |
| `APPLE_API_KEY_BASE64` | `base64 -i AuthKey_XXXX.p8` | base64-encoded App Store Connect .p8 |
| `APPLE_API_KEY_ID` | App Store Connect → Users and Access → Keys | 10-char Key ID — passed as `APPLE_API_KEY` to tauri-action (it's the ID, not the file) |
| `APPLE_API_ISSUER` | App Store Connect → Users and Access → Keys | UUID issuer ID |
| `APPLE_TEAM_ID` | Apple Developer membership page | 10-char team ID |

Set with `gh secret set NAME < file` or via the repo Settings UI.

The Apple Developer Team is `JBTB5G7DRQ` (Christopher Vautour) — same Apple Developer account that signs Conduit. They're separate bundles (`com.khmtools.app` vs Conduit's), but share the Team ID and signing identity by design.

**Verify a release after the fact:**
```bash
codesign -dvv "/Applications/KHM Tools.app"
codesign --verify --deep --strict --verbose=2 "/Applications/KHM Tools.app"
spctl -a -vv -t exec "/Applications/KHM Tools.app"   # expect: source=Notarized Developer ID
stapler validate "/Applications/KHM Tools.app"       # expect: The validate action worked!
```


### Windows code signing

Unsigned NSIS installer. SmartScreen warning expected on first run. Add an EV cert later if desired.

## Run locally

```bash
cd /Users/chris/Github/khmtools-rs
pnpm install                       # one-time
pnpm tauri dev                     # hot-reload dev mode
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build                   # release build (re-do the DMG manually on macOS 26)
```

## Next steps before public release

1. Visual smoke-test from your end (the screens listed above)
2. Decide if `com.khmtools.app` identifier should be renamed
3. Set the eight Apple signing secrets in the GitHub repo (see [macOS code signing](#macos-code-signing))
4. Push the rust-rewrite branch + tag a `v2.0.0-beta.1` to exercise the CI workflow + signing path
5. Verify the produced `.dmg` with `spctl -a -vv` / `stapler validate` (commands in the signing section)
6. After enough beta soak, tag `v2.0.0` for stable

## Open questions for you

- Do you want me to commit this all on the `rust-rewrite` branch now? I haven't committed anything — your call.
- Want to keep the legacy Electron version on `main` indefinitely, or rip it out once you're happy with the Rust version?
- Any preferences on app identifier (`com.khmtools.app` → `com.khmtools.tools`?) or product name?
