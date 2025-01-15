const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to skip
const skippedDirectories = ['node_modules', '.regolith', '.git', '.vscode'];

const runBuildInDirs = (dir = './') => {
  // Get all directories and subdirectories
  fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
    const fullPath = path.join(dir, file.name);

    // Skip files or directories that are in the skipped list
    if (file.isDirectory() && !skippedDirectories.some(skip => fullPath.includes(skip))) {
      const configJsonPath = path.join(fullPath, 'config.json');

      // If config.json exists, run the two commands
      if (fs.existsSync(configJsonPath)) {
        console.log(`Running regolith build process in ${fullPath}`);
        try {
          // Run regolith install-all
          execSync('regolith install-all', { cwd: fullPath, stdio: 'inherit' });

          // After regolith install-all completes, run regolith run build
          execSync('regolith run build', { cwd: fullPath, stdio: 'inherit' });
        } catch (error) {
          console.error(`Build script failed in ${fullPath}`);
          process.exit(1);
        }
      }

      // Recursively check subdirectories
      runBuildInDirs(fullPath);
    }
  });
};

runBuildInDirs();
