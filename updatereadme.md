# Updating JW Tools

This document provides instructions for updating the JW Tools application and releasing new versions.

## Version Management

The application version is defined in the `package.json` file. When releasing a new version, you should update this number following [semantic versioning](https://semver.org/) principles:

- **Major version** (1.0.0): Breaking changes
- **Minor version** (0.1.0): New features without breaking changes
- **Patch version** (0.0.1): Bug fixes and minor improvements

## Creating a New Release

### 1. Update the Version

1. Open `package.json`
2. Update the `version` field (e.g., from "1.0.1" to "1.0.2")
3. Save the file

### 2. Commit Your Changes

```bash
git add .
git commit -m "Prepare release v1.0.2"
```

### 3. Create a Git Tag

```bash
git tag v1.0.2
```

### 4. Push Changes and Tags

```bash
git push origin main
git push origin --tags
```

### 5. Build the Application

Build the application for all target platforms:

```bash
npm run build
```

This will create distribution packages in the `dist` directory.

### 6. Create a GitHub Release

1. Go to your GitHub repository: https://github.com/advenimus/khmtools
2. Click on "Releases" in the right sidebar
3. Click "Create a new release"
4. Select the tag you just pushed (e.g., v1.0.2)
5. Set the release title (e.g., "JW Tools v1.0.2")
6. Add release notes describing the changes in this version
7. Upload the distribution files from your `dist` folder:
   - For Windows: `.exe` installer (e.g., `khmtools-1.0.2-arm64.exe`)
   - For macOS: `.dmg` file
   - For Linux: `.AppImage`, `.deb`, and/or `.rpm` files
8. Click "Publish release"

## Auto-Update Mechanism

JW Tools includes an auto-update mechanism using `electron-updater`. Here's how it works:

1. When the application starts, it checks for updates from your GitHub releases
2. If a newer version is found, a notification appears in the application
3. Users can click to install the update
4. The application will download the update, install it, and restart

### How Auto-Updates Work in Detail

1. The application uses `electron-updater` to check for updates from GitHub releases
2. When the app starts, it calls `autoUpdater.checkForUpdatesAndNotify()`
3. This checks the GitHub repository specified in package.json for releases
4. It compares the version in the latest release with the current app version
5. If a newer version is available, it triggers the `update-available` event
6. The app shows a notification banner to the user
7. When the user clicks to install, the update is downloaded (if not already)
8. After downloading, the app can be restarted to apply the update

Note: Auto-updates only work in packaged applications, not during development.

### Requirements for Auto-Updates

For auto-updates to work correctly:

1. The version in `package.json` must be higher than the currently installed version
2. The GitHub release must include the appropriate distribution files
3. The release must be published (not a draft)
4. The release tag must match the version in `package.json` (prefixed with 'v')
5. The user must have internet access to connect to GitHub

## Testing Updates

To test the update process:

1. Build and install an older version of the application
2. Create a new release with a higher version number
3. Start the older version and verify that it detects and offers to install the update

## Troubleshooting

If updates aren't working:

1. Check that the version number in `package.json` is higher than the installed version
2. Verify that the GitHub release is published and contains the correct files
3. Ensure the release tag matches the version in `package.json` (with 'v' prefix)
4. Check the application logs for any error messages related to updates
   - Logs are stored in `~/Library/Logs/khmtools/main.log` on macOS
   - The app expects files to be named consistently (e.g., `JW-Tools-1.0.2-arm64.dmg`)
5. Verify that the GitHub repository URL in `package.json` is correct

## Additional Resources

- [electron-updater documentation](https://www.electron.build/auto-update)
- [GitHub Releases documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)