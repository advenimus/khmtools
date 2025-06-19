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

function calculateNewVersion(incrementType) {
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
  
  log(`\n📋 Version will be updated: ${currentVersion} → ${newVersion}`, 'yellow');
  
  return { currentVersion, newVersion };
}

function writeVersionToPackage(newVersion) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  packageJson.version = newVersion;
  
  // Write updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  log(`\n✅ Version updated: ${currentVersion} → ${newVersion}`, 'green');
}

async function getBuildMethod() {
  log('\n🔨 Build Method', 'bright');
  log('How would you like to build?', 'cyan');
  console.log('  1) Build locally');
  console.log('  2) Build via GitHub Actions');
  
  const choice = await question('\nSelect (1-2): ');
  return choice === '1' ? 'local' : 'github';
}

async function buildLocally(newVersion) {
  log('\n🏗️  Local Build', 'bright');
  log('Which platform(s) to build for?', 'cyan');
  console.log('  1) macOS only');
  console.log('  2) Windows only');
  console.log('  3) All platforms');
  
  const choice = await question('\nSelect (1-3): ');
  
  // Write version to package.json before building
  log('\n📝 Updating package.json version...', 'blue');
  writeVersionToPackage(newVersion);
  
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
  log('Choose input method:', 'cyan');
  console.log('  1) Paste multi-line text (recommended)');
  console.log('  2) Enter line by line manually');
  
  const choice = await question('\nSelect (1-2): ');
  
  if (choice === '2') {
    log('\nManual entry mode - type each line and press Enter. When done, type "DONE" on a new line:', 'yellow');
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
  
  // Paste mode - temporarily close readline and use raw stdin
  log('\n📋 Paste Mode Active', 'yellow');
  log('Paste your release notes below and press Ctrl+D when finished:', 'cyan');
  log('(The text will appear as you paste it)\n', 'yellow');
  
  // Close readline temporarily
  rl.pause();
  
  return new Promise((resolve) => {
    const chunks = [];
    
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    process.stdin.on('end', () => {
      const fullInput = chunks.join('').trim();
      
      // Resume readline for future questions
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      rl.resume();
      
      log('\n✅ Release notes captured!', 'green');
      resolve(fullInput);
    });
  });
}

async function buildViaGitHub(version) {
  // Get release notes
  const releaseNotes = await getReleaseNotes();
  
  log('\n🚀 Preparing GitHub release...', 'yellow');
  
  try {
    // Write version to package.json before committing
    log('📝 Updating package.json version...', 'blue');
    writeVersionToPackage(version);
    
    // Check for uncommitted changes (including the version update)
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

async function getMainAction() {
  log('\n🎯 Main Action', 'bright');
  log('What would you like to do?', 'cyan');
  console.log('  1) Create new release');
  console.log('  2) Delete existing tag');
  
  const choice = await question('\nSelect (1-2): ');
  return choice === '2' ? 'delete' : 'release';
}

async function deleteTag() {
  log('\n🗑️  Delete Tag', 'bright');
  
  // Show existing tags
  try {
    const tags = execCommand('git tag -l', true);
    if (tags) {
      log('\n📋 Existing tags:', 'cyan');
      tags.split('\n').forEach(tag => {
        if (tag.trim()) {
          console.log(`  ${tag}`);
        }
      });
    } else {
      log('\n⚠️  No tags found in repository', 'yellow');
    }
  } catch (error) {
    log('\n⚠️  Could not fetch tags', 'yellow');
  }
  
  const tagName = await question('\nEnter tag name to delete (e.g., v1.3.3): ');
  
  if (!tagName) {
    log('❌ No tag name provided', 'red');
    return;
  }
  
  // Confirm deletion
  const confirm = await question(`\n⚠️  Are you sure you want to delete tag '${tagName}' locally and remotely? (y/N): `);
  
  if (confirm.toLowerCase() !== 'y') {
    log('Aborted.', 'yellow');
    return;
  }
  
  try {
    // Delete local tag
    log(`\n🗑️  Deleting local tag '${tagName}'...`, 'blue');
    execCommand(`git tag -d ${tagName}`);
    log(`✅ Local tag '${tagName}' deleted`, 'green');
    
    // Delete remote tag
    log(`\n🗑️  Deleting remote tag '${tagName}'...`, 'blue');
    execCommand(`git push origin --delete ${tagName}`);
    log(`✅ Remote tag '${tagName}' deleted`, 'green');
    
    log('\n✅ Tag deletion completed successfully!', 'green');
    
  } catch (error) {
    log(`\n❌ Tag deletion failed: ${error.message}`, 'red');
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
    
    // Get main action
    const action = await getMainAction();
    
    if (action === 'delete') {
      await deleteTag();
      return;
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
    
    // Calculate new version (but don't write it yet)
    const { currentVersion, newVersion } = calculateNewVersion(incrementType);
    
    // Get build method
    const buildMethod = await getBuildMethod();
    
    if (buildMethod === 'local') {
      await buildLocally(newVersion);
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