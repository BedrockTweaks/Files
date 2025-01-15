const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to skip
const skippedDirectories = ['node_modules', '.regolith', '.git', '.vscode'];

const runLintInDirs = (dir = './') => {
  // Get all directories containing package.json and not in the skippedDirectories array
  fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !skippedDirectories.some(skip => fullPath.includes(skip))) {
      const packageJsonPath = path.join(fullPath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        console.log(`Running lint in ${fullPath}`);
        try {
          execSync('npm run lint', { cwd: fullPath, stdio: 'inherit' });
        } catch (error) {
          console.error(`Linting failed in ${fullPath}`);
          process.exit(1);
        }
      }
      // Recursively check subdirectories
      runLintInDirs(fullPath);
    }
  });
};

runLintInDirs();
