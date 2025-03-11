# JW Tools

A cross-platform desktop application built with Electron that provides a collection of useful tools.

## Features

### Zoom Attendance Calculator
Calculate total attendance from Zoom poll results. This tool helps you quickly total up the results of a Zoom poll where:
- Options 1-10 represent the number of people in attendance
- An 11th option for phone connections (valued at 1 person each)

## Installation

### Prerequisites
- Node.js (version 12 or higher)
- npm (usually comes with Node.js)

### Setup
1. Clone this repository
2. Install dependencies:
```
npm install
```

### Running the application
To run the application in development mode:
```
npm start
```

### Building the application
To build the application for your current platform:
```
npm run build
```

To build for specific platforms:
```
npm run package-mac     # macOS
npm run package-win     # Windows
npm run package-linux   # Linux
```

### macOS Security Note
If you encounter security warnings when opening the application on macOS, you may need to remove the quarantine attribute by running:
```
xattr -cr '/path/to/JW Tools.app'
```
Replace `/path/to/JW Tools.app` with the actual path to the application.

## Usage
1. Launch the application
2. Select a tool from the sidebar menu
3. For the Zoom Attendance Calculator:
   - Enter the number of responses for each attendance option (1-10 people)
   - Enter the number of phone connections
   - Click "Calculate Total" to see the total attendance count

## Adding New Tools
More tools will be added in future updates.