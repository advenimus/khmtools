# KHM Tools

**KHM Tools** is a modern, beautifully designed desktop application that provides essential utilities for Kingdom Hall media operations. Built with a sleek dark interface and intuitive user experience, it streamlines common tasks for media servants and technical support teams.

## What is KHM Tools?

KHM Tools is your all-in-one companion for managing Kingdom Hall media presentations. Whether you're calculating meeting attendance from Zoom polls, launching media applications in the correct sequence, or managing your virtual meeting setup, KHM Tools makes these tasks simple and efficient.

## Key Features

### 📊 Zoom Attendance Calculator
Quickly calculate total attendance from Zoom poll results with an intuitive interface. Perfect for hybrid meetings where you need to combine in-person and remote attendance counts.

### 🚀 Smart Application Launcher
Launch Zoom with pre-configured meeting settings, or use the Media Launcher to start OBS Studio, Meeting Media Manager (M³), and Zoom in the perfect sequence for seamless meeting presentations.

### 🎨 Modern Dark Interface
Experience a stunning purple-gradient dark theme with smooth animations and glassmorphism effects that's easy on the eyes during extended use.

### ⚡ Auto-Updates
Stay current with automatic update notifications and one-click installation of new features and improvements.

## How to Use KHM Tools

### Getting Started
1. Download the latest version for your operating system
2. Install the application (on macOS, drag to Applications folder)
3. Launch KHM Tools
4. Select a tool from the left sidebar

### Using the Zoom Attendance Calculator
1. Click on "Zoom Attendance Calculator" in the sidebar
2. Enter the number of responses for each attendance option:
   - Options 1-10 represent the number of people watching together
   - Phone connections count as 1 person each
3. Click "Calculate" or press Enter to see the total attendance
4. Use "Calculate Again" to reset and start a new calculation

### Using the Smart Launchers

#### Start Zoom
1. Click on "Start Zoom" in the sidebar
2. Configure your meeting settings:
   - Click the settings icon
   - Enter your recurring meeting ID
   - Browse to select your Zoom application path (if needed)
3. Click "Launch Zoom" to join your meeting automatically

#### Media Launcher
1. Click on "Media Launcher" in the sidebar
2. Configure application paths in settings (one-time setup):
   - OBS Studio path
   - Meeting Media Manager path
   - Zoom path
3. Optionally enable custom messages for synchronization reminders
4. Click "Launch Media Tools" to start all applications in sequence

### Customization Options
- **Always Open Maximized**: Set the app to start in full-screen mode
- **Default Tool**: Choose which tool opens automatically on startup
- **Custom Messages**: Add personalized reminders for your media workflow

---

## Technical Information

### System Requirements
- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.15 or later (Apple Silicon and Intel supported)
- **Linux**: Ubuntu 20.04 or later, Fedora 32 or later

### Installation

#### Windows
1. Download the `.exe` installer
2. Run the installer and follow the prompts
3. KHM Tools will be available in your Start Menu

#### macOS
1. Download the `.dmg` file
2. Open the DMG and drag KHM Tools to your Applications folder
3. First time running: Right-click and select "Open" to bypass Gatekeeper

If you encounter security warnings, you may need to run:
```bash
xattr -cr '/Applications/KHM Tools.app'
```

#### Linux
1. Download the `.AppImage` or `.deb` file
2. For AppImage: Make it executable and run
3. For DEB: Install using your package manager

### Development

#### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

#### Setup
```bash
# Clone the repository
git clone https://github.com/advenimus/khmtools.git
cd khmtools

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

#### Building from Source
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build-mac     # macOS
npm run build-win     # Windows
npm run build-linux   # Linux
```

### Architecture
- **Framework**: Electron 35
- **UI**: Vanilla JavaScript with custom CSS
- **Auto-Updates**: electron-updater
- **Build System**: electron-builder

### Contributing
We welcome contributions! Please feel free to submit issues or pull requests on our GitHub repository.

### License
ISC License - see LICENSE file for details

### Support
For issues, feature requests, or questions, please visit our [GitHub repository](https://github.com/advenimus/khmtools).