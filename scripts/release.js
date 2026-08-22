import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function runCommand(command, cwd = process.cwd()) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return false;
  }
}

async function main() {
  console.log('=== Kodon Release Assistant ===\n');

  // 1. Check if git status is clean
  try {
    const gitStatus = execSync('git status --porcelain').toString().trim();
    if (gitStatus !== '') {
      console.warn('⚠️ Warning: Your git working directory is not clean:');
      console.log(gitStatus);
      const proceed = await question('\nDo you want to proceed anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Release cancelled.');
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('Failed to check git status. Make sure git is installed and this is a repository.');
    process.exit(1);
  }

  // 2. Read current version from package.json
  const packageJsonPath = path.resolve('package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  console.log(`Current version: ${currentVersion}`);

  // Calculate bumped version suggestions
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  const nextPatch = `${major}.${minor}.${patch + 1}`;
  const nextMinor = `${major}.${minor + 1}.0`;
  const nextMajor = `${major + 1}.0.0`;

  console.log(`Suggestions:`);
  console.log(`1. Patch: ${nextPatch}`);
  console.log(`2. Minor: ${nextMinor}`);
  console.log(`3. Major: ${nextMajor}`);

  const choice = await question('\nSelect option (1-3) or type custom version: ');
  let newVersion = choice.trim();
  if (choice === '1') newVersion = nextPatch;
  else if (choice === '2') newVersion = nextMinor;
  else if (choice === '3') newVersion = nextMajor;

  // Validate version format
  if (!/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/.test(newVersion)) {
    console.error(`Invalid version format: "${newVersion}". Expected semver (e.g. 1.2.3).`);
    process.exit(1);
  }

  console.log(`\nNew version will be: ${newVersion}`);
  const confirm = await question('Proceed with update? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('Aborted.');
    process.exit(1);
  }

  // 3. Update files
  console.log('\nUpdating version files...');

  // package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✓ Updated package.json');

  // src-tauri/tauri.conf.json
  const tauriConfPath = path.resolve('src-tauri/tauri.conf.json');
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    tauriConf.version = newVersion;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log('✓ Updated src-tauri/tauri.conf.json');
  }

  // src-tauri/Cargo.toml
  const cargoTomlPath = path.resolve('src-tauri/Cargo.toml');
  if (fs.existsSync(cargoTomlPath)) {
    let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
    cargoToml = cargoToml.replace(/^version\s*=\s*"[^"]*"/m, `version = "${newVersion}"`);
    fs.writeFileSync(cargoTomlPath, cargoToml);
    console.log('✓ Updated src-tauri/Cargo.toml');
  }

  // 4. Run verification checks
  console.log('\n=== Running Verification Checks ===');

  const runTests = await question('Run frontend tests? (Y/n): ');
  if (runTests.toLowerCase() !== 'n') {
    if (!runCommand('npm run test')) {
      console.error('❌ Frontend tests failed.');
      process.exit(1);
    }
  }

  const runRustChecks = await question('Run Rust clippy & checks? (Y/n): ');
  if (runRustChecks.toLowerCase() !== 'n') {
    if (!runCommand('cargo check', 'src-tauri') || !runCommand('cargo clippy', 'src-tauri')) {
      console.error('❌ Rust checks failed.');
      process.exit(1);
    }
  }

  // 5. Build release artifacts
  const buildApp = await question('Build production binary/installer? (y/N): ');
  if (buildApp.toLowerCase() === 'y') {
    if (!runCommand('npm run tauri build')) {
      console.warn('⚠️ Tauri build finished with warnings/errors (expected if missing signature key).');
    } else {
      console.log('✓ Production binary built successfully.');
    }
  }

  // 6. Git commit & tag
  console.log('\n=== Git Commit & Tagging ===');
  const createGitCommit = await question('Stage, commit and tag version change in Git? (Y/n): ');
  if (createGitCommit.toLowerCase() !== 'n') {
    runCommand('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml');
    if (runCommand(`git commit -m "bump: version to v${newVersion}"`)) {
      runCommand(`git tag -a v${newVersion} -m "release v${newVersion}"`);
      console.log(`\n✓ Committed and tagged v${newVersion}`);
      console.log(`\nNext steps:`);
      console.log(`To push to remote: git push origin main --tags`);
    } else {
      console.error('❌ Git commit failed.');
    }
  }

  console.log('\nDone!');
  rl.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
