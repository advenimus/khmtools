# KHM Tools v1.2.0 Release Notes 🚀

  ## 🔧 Bug Fixes & System Improvements

  ### **Unified Settings System Overhaul**
  - 🐛 **Fixed Meeting Settings tab not opening** - Resolved critical issue preventing access to meeting configuration
  - 🔄 **Fixed settings not loading properly** - Unified settings now load consistently across all tabs
  - 🎯 **Consolidated duplicate Zoom path settings** - Eliminated confusion from multiple Zoom path configurations
  - 💾 **Improved settings save behavior** - Settings window now stays open after saving for better user experience

  ### **Enhanced Application Path Management**
  - 🎯 **Added default application paths** for OBS Studio, Meeting Media Manager, and Zoom on both macOS and Windows
  - 🔍 **Automatic path detection** - Applications are now found automatically without manual configuration
  - 🪟 **Fixed Meeting Media Manager default path on Windows** - Corrected path resolution for Windows installations

  ## ✨ New Features

  ### **Auto-Launch at System Startup**
  - 🚀 **"Run at Logon" feature** - KHM Tools can now start automatically when you log into your system
  - 🍎 **Cross-platform support** - Works seamlessly on both macOS and Windows
  - 🔒 **No admin rights required** - Uses system APIs that don't require elevated permissions
  - 🏷️ **Proper macOS branding** - Shows "KHM Tools" instead of "Electron" in system notifications

  ### **Enhanced Error Handling & User Feedback**
  - 📱 **UI error display** - Media Launcher errors now appear in the user interface instead of just the console
  - 💬 **Detailed error messages** - More informative error messages help users troubleshoot issues
  - ✅ **Success/failure feedback** - Clear indicators when operations complete successfully or fail

  ### **Developer Experience Improvements**
  - 🖥️ **Console redirection** - Terminal output now also appears in Electron DevTools console for better debugging
  - 🏷️ **Improved app identification** - Better Windows system integration with proper app user model ID
  - 🔧 **Enhanced logging** - More comprehensive logging throughout the application

  ## 🎨 User Interface Enhancements

  ### **Streamlined Settings Experience**
  - 📋 **Unified settings interface** - All application settings now accessible from a single, organized interface
  - 🎛️ **Improved settings navigation** - Better organization of configuration options
  - 💾 **Persistent settings window** - Window remains open after saving for multiple configuration changes

  ### **Better System Integration**
  - 🏷️ **Consistent branding** - Application properly identifies itself as "KHM Tools" across all system interactions
  - 🪟 **Improved Windows experience** - Better taskbar and notification integration on Windows
  - 🍎 **Enhanced macOS experience** - Proper app bundle identification and system notification branding

  ## 🛠️ Technical Improvements

  ### **Code Quality & Maintainability**
  - 🔄 **Refactored settings management** - More maintainable and reliable settings system
  - 🎯 **Improved error handling patterns** - Consistent error handling across all modules
  - 📝 **Enhanced logging infrastructure** - Better debugging and troubleshooting capabilities

  ### **Cross-Platform Compatibility**
  - 🌐 **Improved platform detection** - Better handling of platform-specific features and paths
  - 🔧 **Enhanced executable detection** - More reliable application path resolution across platforms
  - 📦 **Better packaging integration** - Improved support for different installation methods

  ---

  ## 📥 Download

  Get the latest version from the [Releases page](https://github.com/advenimus/khmtools/releases/tag/v1.2.0)

  **Platform Downloads:**
  - 🍎 **macOS**: `KHM-Tools-1.2.0-mac-arm64.dmg`
  - 🪟 **Windows**: `KHM-Tools-1.2.0-win-x64.exe`
  - 🐧 **Linux**: `KHM-Tools-1.2.0-linux.AppImage`

  ## 🔄 Upgrade Notes

  - Existing settings will be automatically migrated to the new unified system
  - Auto-launch feature is disabled by default - enable it in Settings if desired
  - Default application paths will be automatically detected on first launch

  ---

  **Full Changelog**: https://github.com/advenimus/khmtools/commits/v1.2.0
