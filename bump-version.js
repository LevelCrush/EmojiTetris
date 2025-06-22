#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // major, minor, patch

// Files that need version updates
const VERSION_JSON = path.join(__dirname, 'version.json');
const VERSION_CHECK_JS = path.join(__dirname, 'version-check.js');
const INDEX_HTML = path.join(__dirname, 'index.html');

// Read current version
function getCurrentVersion() {
    const versionData = JSON.parse(fs.readFileSync(VERSION_JSON, 'utf8'));
    return versionData.version;
}

// Increment version based on type
function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch(type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2]++;
            break;
    }
    
    return parts.join('.');
}

// Update version.json
function updateVersionJson(newVersion) {
    const versionData = {
        version: newVersion,
        updated: new Date().toISOString().split('T')[0]
    };
    fs.writeFileSync(VERSION_JSON, JSON.stringify(versionData, null, 2) + '\n');
    console.log(`✅ Updated version.json to ${newVersion}`);
}

// Update version-check.js
function updateVersionCheckJs(newVersion) {
    let content = fs.readFileSync(VERSION_CHECK_JS, 'utf8');
    content = content.replace(
        /const CURRENT_VERSION = '[^']+'/,
        `const CURRENT_VERSION = '${newVersion}'`
    );
    fs.writeFileSync(VERSION_CHECK_JS, content);
    console.log(`✅ Updated version-check.js to ${newVersion}`);
}

// Update index.html cache busters
function updateIndexHtml(newVersion) {
    let content = fs.readFileSync(INDEX_HTML, 'utf8');
    
    // Update CSS link
    content = content.replace(
        /href="style\.css\?v=[^"]+"/,
        `href="style.css?v=${newVersion}"`
    );
    
    // Update all script tags
    content = content.replace(
        /src="([^"]+\.js)\?v=[^"]+"/g,
        `src="$1?v=${newVersion}"`
    );
    
    // Update version display
    content = content.replace(
        /<span id="version-number">[^<]+<\/span>/,
        `<span id="version-number">${newVersion}</span>`
    );
    
    fs.writeFileSync(INDEX_HTML, content);
    console.log(`✅ Updated index.html cache busters to ${newVersion}`);
}

// Create git commit
function createGitCommit(newVersion, oldVersion) {
    const { execSync } = require('child_process');
    
    try {
        // Stage the version files
        execSync('git add version.json version-check.js index.html');
        
        // Create commit
        const commitMessage = `Bump version from ${oldVersion} to ${newVersion}

- Updated version.json
- Updated CURRENT_VERSION in version-check.js
- Updated cache busters in index.html
- Updated version display in HTML

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
        
        execSync(`git commit -m "${commitMessage}"`);
        console.log(`✅ Created git commit for version ${newVersion}`);
    } catch (error) {
        console.log('⚠️  Git commit failed - files updated but not committed');
        console.log('   You may need to commit manually');
    }
}

// Main function
function main() {
    try {
        // Get current version
        const currentVersion = getCurrentVersion();
        console.log(`Current version: ${currentVersion}`);
        
        // Calculate new version
        const newVersion = incrementVersion(currentVersion, bumpType);
        console.log(`New version: ${newVersion} (${bumpType} bump)`);
        
        // Update all files
        updateVersionJson(newVersion);
        updateVersionCheckJs(newVersion);
        updateIndexHtml(newVersion);
        
        // Create git commit
        createGitCommit(newVersion, currentVersion);
        
        console.log(`\n🎉 Version successfully bumped to ${newVersion}!`);
        console.log('\nNext steps:');
        console.log('1. Push to GitHub: git push');
        console.log('2. The new version will be automatically detected by users');
        
    } catch (error) {
        console.error('❌ Error bumping version:', error.message);
        process.exit(1);
    }
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node bump-version.js [type]');
    console.log('');
    console.log('Types:');
    console.log('  major  - Increment major version (1.0.0 -> 2.0.0)');
    console.log('  minor  - Increment minor version (1.0.0 -> 1.1.0)');
    console.log('  patch  - Increment patch version (1.0.0 -> 1.0.1) [default]');
    console.log('');
    console.log('Example:');
    console.log('  node bump-version.js patch');
    process.exit(0);
}

// Run the script
main();