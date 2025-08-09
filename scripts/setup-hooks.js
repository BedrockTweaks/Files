const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to ensure a directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

try {
  // Step 1: Backup existing Git LFS hooks if they exist
  if (fs.existsSync('.git/hooks')) {
    console.log('Backing up existing Git hooks...');
    ensureDir('lfs-hooks');

    // Copy LFS hooks to backup location
    const hooksToBackup = ['post-checkout', 'post-commit', 'post-merge', 'pre-push'];
    hooksToBackup.forEach(hook => {
      const hookPath = `.git/hooks/${hook}`;
      if (fs.existsSync(hookPath)) {
        fs.copyFileSync(hookPath, `lfs-hooks/${hook}`);
        // Make the backup hook executable
        fs.chmodSync(`lfs-hooks/${hook}`, '755');
      }
    });
  }

  // Step 2: Create .husky directory
  ensureDir('.husky');

  // Step 3: Create the hooks
  console.log('Setting up hooks...');

  // Create pre-commit hook for linting
  const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
`;
  fs.writeFileSync('.husky/pre-commit', preCommitContent, { mode: 0o755 });

  // Create other hooks that incorporate LFS
  const hooks = ['post-checkout', 'post-commit', 'post-merge', 'pre-push'];
  hooks.forEach(hook => {
    const hookContent = `#!/usr/bin/env sh
if [ -f "lfs-hooks/${hook}" ]; then
  ./lfs-hooks/${hook} "$@"
fi
. "$(dirname -- "$0")/_/husky.sh"
`;
    fs.writeFileSync(`.husky/${hook}`, hookContent, { mode: 0o755 });
  });

  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Error during setup:', error);
  process.exit(1);
}
