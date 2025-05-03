# Building JW Tools

This document provides instructions for building the JW Tools application for different platforms.

## Prerequisites

Before building the application, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (v18 or later)
* npm (usually comes with Node.js)
* Git

## Setup


1. Clone the repository:

   ```bash
   git clone https://github.com/advenimus/jwtools.git
   cd jwtools
   ```
2. Install dependencies:

   ```bash
   npm install
   ```

## Building for Development

To run the application in development mode:

```bash
npm run start
```

## Building for Distribution

### Building for All Platforms

To build the application for all platforms (macOS, Windows, and Linux):

```bash
npm run build
```

This will create distribution packages in the `dist` directory.

### Building for Specific Platforms

#### macOS

```bash
npm run package-mac
```

This will create a `.dmg` file in the `dist` directory.

#### Windows

```bash
npm run package-win
```

This will create a Windows installer (`.exe`) in the `dist` directory.

#### Linux

```bash
npm run package-linux
```

This will create Linux packages (`.AppImage`, `.deb`, etc.) in the `dist` directory.

## File Naming Conventions

The application is configured to use consistent naming conventions for distribution files:

* macOS: `JW-Tools-[version]-[arch].dmg` (e.g., `JW-Tools-1.0.2-arm64.dmg`)
* Windows: `JW-Tools-[version]-[arch].exe` (e.g., `JW-Tools-1.0.2-arm64.exe`)

This naming convention is important for the auto-update mechanism to work correctly.

## Notes for Cross-Platform Building

### Building on macOS

When building on macOS:

* You can build for macOS natively
* For Windows builds, no additional setup is required as electron-builder handles this
* For Linux builds, no additional setup is required

### Building on Windows

When building on Windows:

* You can build for Windows natively
* For macOS builds, you'll need a Mac (Apple's requirements)
* For Linux builds, no additional setup is required

### Building on Linux

When building on Linux:

* You can build for Linux natively
* For Windows builds, Wine is recommended
* For macOS builds, you'll need a Mac (Apple's requirements)

## Signing Your Application

For production releases, you should sign your application:


1. For macOS, you'll need an Apple Developer account and certificates
2. For Windows, you'll need a code signing certificate

Update the `build` section in `package.json` with your signing information.

## Troubleshooting

If you encounter issues during the build process:


1. Ensure all dependencies are installed correctly
2. Check that you have the latest version of electron-builder
3. Verify that your Node.js version is compatible
4. For platform-specific issues, refer to the [electron-builder documentation](https://www.electron.build/)


