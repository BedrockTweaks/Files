#!/usr/bin/env node
/** Scaffold builder addons into the Bedrock Tweaks Yarn workspace. */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const BRAND = 'Bedrock Tweaks';
const HELP = `Usage: yarn create-addon [category[/subcategory...]] [addon_name] [description...] [options]

Omit details to answer interactive prompts.
  --author <name>       Author credit (defaults to git user.name)
  --description <text>  Addon description
  --preset <preset>    full, script, or resource (default: full)
  --install            Install dependencies at the repository root
  --yes                Use defaults without prompts; category and name are required
  --help               Show this help

Example: yarn create-addon gameplay_changes my_addon --author "Your Name"`;

export function parseArgs(args) {
  const options = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--help', '-h', '--yes', '-y', '--install'].includes(arg)) {
      options[arg === '-h' ? 'help' : arg === '-y' ? 'yes' : arg.slice(2)] = true;
    } else if (['--author', '--description', '--preset'].includes(arg)) {
      const value = args[++i];
      if (!value?.trim() || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
      options[arg.slice(2)] = value;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  const [category, name, ...words] = positional;
  return { ...options, category, name, description: options.description ?? (words.length ? words.join(' ') : undefined) };
}

export function validateInput({ category, name, preset = 'full' }) {
  if (!category || !category.split('/').every(segment => NAME_RE.test(segment))) {
    throw new Error('Category must contain lowercase path segments, e.g. gameplay_changes or gameplay_changes/utility.');
  }
  if (!name || !NAME_RE.test(name)) throw new Error('Addon name must start with a lowercase letter and contain only lowercase letters, digits and underscores.');
  if (!['full', 'script', 'resource'].includes(preset)) throw new Error('Preset must be full, script, or resource.');
}

export async function collectOptions(input, { base = root, interactive = Boolean(process.stdin.isTTY), ask = prompts } = {}) {
  if (input.category && !input.category.split('/').every(segment => NAME_RE.test(segment))) throw new Error('Invalid category.');
  if (input.name && !NAME_RE.test(input.name)) throw new Error('Invalid addon name.');
  if (input.preset && !['full', 'script', 'resource'].includes(input.preset)) throw new Error('Invalid preset.');
  const gitName = spawnSync('git', ['config', 'user.name'], { cwd: base, encoding: 'utf8' }).stdout?.trim();
  const defaults = { author: gitName || BRAND, description: 'A Bedrock Tweaks addon.', preset: 'full', install: false };
  const selected = { ...defaults, ...Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) };
  if (!input.yes && interactive) {
    const categoriesDir = path.join(base, 'addons', 'files');
    const categories = existsSync(categoriesDir) ? readdirSync(categoriesDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort() : [];
    const questions = [];
    if (!input.category) {
      questions.push({ type: 'select', name: 'categoryChoice', message: 'Addon category:', choices: [...categories.map(value => ({ title: value, value })), { title: 'New or nested category', value: '' }] });
      questions.push({ type: (_, values) => values.categoryChoice === '' ? 'text' : null, name: 'newCategory', message: 'Category path:', validate: value => value.split('/').every(segment => NAME_RE.test(segment)) || 'Use lowercase letters, digits and underscores in every segment.' });
    }
    if (!input.name) questions.push({ type: 'text', name: 'name', message: 'Addon name:', validate: value => NAME_RE.test(value) || 'Use a lowercase name such as my_addon.' });
    if (!input.author) questions.push({ type: 'text', name: 'author', message: 'Author:', initial: defaults.author, validate: value => Boolean(value.trim()) || 'Enter an author.' });
    if (!input.description) questions.push({ type: 'text', name: 'description', message: 'Description:', initial: defaults.description, validate: value => Boolean(value.trim()) || 'Enter a description.' });
    if (!input.preset) questions.push({ type: 'select', name: 'preset', message: 'Project preset:', choices: [{ title: 'Full Core addon with UI', value: 'full' }, { title: 'Behavior pack with scripts', value: 'script' }, { title: 'Resource pack', value: 'resource' }] });
    if (!input.install) questions.push({ type: 'confirm', name: 'install', message: 'Install dependencies in the repository root?', initial: false });
    let cancelled = false;
    const answers = await ask(questions, { onCancel: () => { cancelled = true; return false; } });
    if (cancelled) return undefined;
    Object.assign(selected, answers);
    if (!input.category) selected.category = answers.categoryChoice || answers.newCategory;
  }
  if (!selected.category || !selected.name) throw new Error(`Category and addon name are required without an interactive terminal.\n${HELP}`);
  validateInput(selected);
  return selected;
}

function existingPackage(directory, packageName) {
  if (!existsSync(directory)) return undefined;
  const manifest = path.join(directory, 'package.json');
  if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === packageName) return directory;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || ['node_modules', 'build', 'dist'].includes(entry.name)) continue;
    const match = existingPackage(path.join(directory, entry.name), packageName);
    if (match) return match;
  }
  return undefined;
}

export function scaffold(options, { base = root, run = spawnSync } = {}) {
  validateInput(options);
  const { category, name, author, description, preset = 'full' } = options;
  const segments = category.split('/');
  const prefix = segments.map(segment => segment.split('_').map(word => word[0]).join('')).join('_');
  const projectName = `${prefix}_${name}`;
  const categoryDir = path.join(base, 'addons', 'files', ...segments);
  const scaffoldDir = path.join(categoryDir, projectName);
  const targetDir = path.join(categoryDir, name);
  if (existsSync(targetDir) || existsSync(scaffoldDir)) throw new Error(`Addon directory already exists: ${targetDir} or ${scaffoldDir}`);
  const duplicate = existingPackage(path.join(base, 'addons', 'files'), `@bedrock-tweaks/${name}`);
  if (duplicate) throw new Error(`Workspace @bedrock-tweaks/${name} already exists: ${duplicate}`);
  const require = createRequire(import.meta.url);
  const cli = process.env.BEDROCK_CORE_CLI || require.resolve('@bedrock-core/cli/dist/index.js');
  mkdirSync(categoryDir, { recursive: true });
  const args = [cli, projectName, '--author', author, '--description', description, '--creator-id', 'bt', '--pack-id', projectName, '--preset', preset, '--package-manager', 'none'];
  const result = run(process.execPath, args, { cwd: categoryDir, stdio: 'inherit' });
  if (result.error || result.status !== 0 || !existsSync(scaffoldDir)) throw new Error(`Core CLI failed to create the addon${result.error ? `: ${result.error.message}` : '.'}`);
  renameSync(scaffoldDir, targetDir);
  // The parent workspace owns Git metadata and package-manager state.
  for (const file of ['.git', 'yarn.lock', '.yarnrc.yml', '.yarn']) rmSync(path.join(targetDir, file), { recursive: true, force: true });
  const packagePath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  pkg.name = `@bedrock-tweaks/${name}`;
  pkg.private = true;
  delete pkg.packageManager;
  pkg.scripts ??= {};
  if (pkg.scripts.typecheck) pkg.scripts.typecheck = pkg.scripts.typecheck.replace('node node_modules/typescript-native/bin/tsc', 'tsc');
  for (const script of ['loopback', 'loopback:preview', 'bds:fetch', 'bds:where']) delete pkg.scripts[script];
  if (pkg.scripts['test:mc']) pkg.scripts['test:mc'] = pkg.scripts['test:mc'].replace('bc-bds run', 'yarn run -T bc-bds run');
  if (pkg.scripts['build:optimized']) pkg.scripts['build:optimized'] = pkg.scripts['build:optimized'].replace('bc-bds optimize', 'yarn run -T bc-bds optimize');
  if (pkg.devDependencies) delete pkg.devDependencies['@bedrock-core/bds-runner'];
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, '\t')}\n`);
  appendFileSync(path.join(targetDir, '.gitignore'), '\n# Downloaded shared UI resource pack\ncore-ui-*.mcpack\n');
  const configPath = path.join(targetDir, 'config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.authors = [...new Set([BRAND, author])];
  writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`);
  for (const pack of ['BP', 'RP']) {
    const file = path.join(targetDir, 'packs', pack, 'manifest.json');
    if (!existsSync(file)) continue;
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    manifest.metadata = { ...manifest.metadata, authors: config.authors };
    writeFileSync(file, `${JSON.stringify(manifest, null, '\t')}\n`);
  }
  // Register every category level so nested addons are reachable from root Yarn.
  let parent = path.join(base, 'addons', 'files');
  for (const segment of [...segments, name]) {
    if (parent !== path.join(base, 'addons', 'files')) {
      const file = path.join(parent, 'package.json');
      const categoryPkg = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { private: true, workspaces: [] };
      categoryPkg.workspaces ??= [];
      if (!categoryPkg.workspaces.includes(segment)) categoryPkg.workspaces.push(segment);
      categoryPkg.workspaces.sort();
      writeFileSync(file, `${JSON.stringify(categoryPkg, null, '\t')}\n`);
    }
    parent = path.join(parent, segment);
  }
  return { targetDir, namespace: `bt_${projectName}`, packageName: pkg.name };
}

async function main() {
  const input = parseArgs(process.argv.slice(2));
  if (input.help) { console.info(HELP); return; }
  const options = await collectOptions(input);
  if (!options) { console.info('Creation cancelled.'); return; }
  const result = scaffold(options);
  if (options.install) {
    const yarn = process.env.npm_execpath;
    if (!yarn || !/yarn/i.test(yarn)) throw new Error('Addon created. Run yarn install at the repository root to install dependencies.');
    const install = spawnSync(process.execPath, [yarn, 'install'], { cwd: root, stdio: 'inherit' });
    if (install.error || install.status !== 0) throw new Error('Addon created; dependency installation failed. Run yarn install at the repository root.');
  }
  console.info(`\nCreated ${path.relative(root, result.targetDir)} (namespace ${result.namespace}).`);
  if (!options.install) console.info('1. Run yarn install at the repository root.');
  const next = options.install ? 1 : 2;
  console.info(`${next}. Run yarn workspace ${result.packageName} build.`);
  console.info(`${next + 1}. Add '${options.name}' to addons/packs.json under '${options.category}'.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
