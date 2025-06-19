#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, silent = false) {
  try {
    const result = execSync(command, { encoding: 'utf8' });
    if (!silent) {
      console.log(result.trim());
    }
    return result.trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function getVersionIncrement() {
  log('\n📦 Version Update', 'bright');
  log('What type of version update is this?', 'cyan');
  console.log('  1) Major (x.0.0) - Breaking changes');
  console.log('  2) Minor (0.x.0) - New features');
  console.log('  3) Patch (0.0.x) - Bug fixes');
  
  const choice = await question('\nSelect (1-3): ');
  
  switch (choice) {
    case '1': return 'major';
    case '2': return 'minor';
    case '3': return 'patch';
    default:
      log('Invalid choice. Using patch.', 'yellow');
      return 'patch';
  }
}

async function updateVersion(incrementType) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  // Increment version
  const versionParts = currentVersion.split('.');
  let [major, minor, patch] = versionParts.map(Number);
  
  switch (incrementType) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
      patch++;
      break;
  }
  
  const newVersion = `${major}.${minor}.${patch}`;
  packageJson.version = newVersion;
  
  // Write updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  log(`\n✅ Version updated: ${currentVersion} → ${newVersion}`, 'green');
  
  return newVersion;
}

async function getBuildMethod() {
  log('\n🔨 Build Method', 'bright');
  log('How would you like to build?', 'cyan');
  console.log('  1) Build locally');
  console.log('  2) Build via GitHub Actions');
  
  const choice = await question('\nSelect (1-2): ');
  return choice === '1' ? 'local' : 'github';
}

async function buildLocally() {
  log('\n🏗️  Local Build', 'bright');
  log('Which platform(s) to build for?', 'cyan');
  console.log('  1) macOS only');
  console.log('  2) Windows only');
  console.log('  3) All platforms');
  
  const choice = await question('\nSelect (1-3): ');
  
  log('\n🚀 Starting build...', 'yellow');
  
  try {
    switch (choice) {
      case '1':
        log('Building for macOS...', 'blue');
        execCommand('npm run build-mac');
        break;
      case '2':
        log('Building for Windows...', 'blue');
        execCommand('npm run build-win');
        break;
      case '3':
        log('Building for all platforms...', 'blue');
        execCommand('npm run build');
        break;
      default:
        log('Invalid choice. Building all platforms...', 'yellow');
        execCommand('npm run build');
    }
    
    log('\n✅ Build completed successfully!', 'green');
    log('Build artifacts are in the dist/ directory', 'cyan');
  } catch (error) {
    log(`\n❌ Build failed: ${error.message}`, 'red');
    throw error;
  }
}

async function getReleaseNotes() {
  log('\n📝 Release Notes', 'bright');
  log('Enter release notes (Markdown supported, including emojis)', 'cyan');
  log('Type each line and press Enter. When done, type "DONE" on a new line:', 'yellow');
  
  const lines = [];
  
  while (true) {
    const line = await question('');
    if (line.toUpperCase() === 'DONE') {
      break;
    }
    lines.push(line);
  }
  
  return lines.join('\n');
}

async function buildViaGitHub(version) {
  // Get release notes
  const releaseNotes = await getReleaseNotes();
  
  log('\n🚀 Preparing GitHub release...', 'yellow');
  
  try {
    // Check for uncommitted changes
    const status = execCommand('git status --porcelain', true);
    if (status) {
      log('Uncommitted changes detected. Committing...', 'blue');
      
      // Add all changes
      execCommand('git add .');
      
      // Commit with version bump message
      const commitMessage = `chore: bump version to v${version}`;
      execCommand(`git commit -m "${commitMessage}"`);
      log('✅ Changes committed', 'green');
    }
    
    // Create tag
    const tagName = `v${version}`;
    log(`\nCreating tag ${tagName}...`, 'blue');
    
    // Create annotated tag with release notes
    const tagMessage = `Release ${tagName}\n\n${releaseNotes}`;
    
    // Write release notes to temp file to handle multiline content
    const tempFile = path.join(process.cwd(), '.release-notes-temp.txt');
    fs.writeFileSync(tempFile, tagMessage);
    
    try {
      execCommand(`git tag -a ${tagName} -F "${tempFile}"`);
      log(`✅ Tag ${tagName} created`, 'green');
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
    
    // Push commits and tag
    log('\nPushing to GitHub...', 'blue');
    execCommand('git push origin main');
    execCommand(`git push origin ${tagName}`);
    
    log('\n✅ Successfully pushed to GitHub!', 'green');
    log('\n📋 Next steps:', 'bright');
    log(`1. Check GitHub Actions at: https://github.com/advenimus/khmtools/actions`, 'cyan');
    log(`2. Once build completes, edit the release at: https://github.com/advenimus/khmtools/releases/tag/${tagName}`, 'cyan');
    log('3. Add the release notes to the GitHub release description', 'cyan');
    
    // Save release notes to file for reference
    const releaseNotesFile = path.join(process.cwd(), `RELEASE_NOTES_${tagName}.md`);
    fs.writeFileSync(releaseNotesFile, `# KHM Tools ${tagName} Release Notes 🚀\n\n${releaseNotes}`);
    log(`\n💾 Release notes saved to: ${releaseNotesFile}`, 'yellow');
    
  } catch (error) {
    log(`\n❌ GitHub release failed: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log('🚀 KHM Tools Release Script', 'bright');
  log('==========================\n', 'bright');
  
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Please run this script from the project root.');
    }
    
    // Check git status
    const branch = execCommand('git branch --show-current', true);
    if (branch !== 'main') {
      log(`⚠️  Warning: You're on branch '${branch}', not 'main'`, 'yellow');
      const proceed = await question('Continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        log('Aborted.', 'red');
        process.exit(1);
      }
    }
    
    // Get version increment type
    const incrementType = await getVersionIncrement();
    
    // Update version
    const newVersion = await updateVersion(incrementType);
    
    // Get build method
    const buildMethod = await getBuildMethod();
    
    if (buildMethod === 'local') {
      await buildLocally();
      log('\n✅ Done! Check the dist/ directory for build artifacts.', 'green');
    } else {
      await buildViaGitHub(newVersion);
      log('\n✅ Done! Check GitHub Actions for build progress.', 'green');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();