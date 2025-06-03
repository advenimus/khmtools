# Build Instructions for JW Tools

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Building for Release

### Build for all platforms
```bash
npm run build
```

This will create:
- macOS ARM64 (Apple Silicon) - `.dmg` and `.zip` files
- Windows x64 - `.exe` installer
- Linux - `.AppImage` and `.deb` files

### Build for specific platforms
```bash
# macOS ARM64 only
npm run build-mac

# Windows x64 only
npm run build-win

# Linux only
npm run build-linux
```

## Auto-Update Configuration

The app is configured to auto-update from GitHub releases. When you create a new release:

1. Update the version in `package.json`
2. Commit the changes
3. Create a git tag: `git tag v1.0.8`
4. Push the tag: `git push origin v1.0.8`
5. The GitHub Action will automatically build and publish the release

## Manual Release Process

If you need to manually create a release:

1. Build the app: `npm run build`
2. Go to GitHub releases page
3. Create a new release with the tag `v1.0.8` (match package.json version)
4. Upload the built files from the `dist` folder:
   - `JW-Tools-1.0.8-mac-arm64.dmg`
   - `JW-Tools-1.0.8-mac-arm64.zip`
   - `JW-Tools-1.0.8-win-x64.exe`
   - `JW-Tools-1.0.8-linux-x86_64.AppImage`
   - `JW-Tools-1.0.8-linux-amd64.deb`
   - `latest-mac.yml`
   - `latest-linux.yml`
   - `latest.yml` (for Windows)

## Notes

- The app will check for updates on startup
- Updates are downloaded in the background
- Users will be prompted to install updates when ready
- The auto-updater uses the GitHub releases API