#!/usr/bin/env node
/** Scaffold builder addons into the Bedrock Tweaks Yarn workspace. */
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';

type Preset = 'full' | 'script' | 'resource';

interface CreateInput {
  category?: string;
  name?: string;
  author?: string;
  description?: string;
  preset?: string;
  install?: boolean;
  yes?: boolean;
  help?: boolean;
}

interface ScaffoldOptions extends CreateInput {
  category: string;
  name: string;
  author: string;
  description: string;
  preset?: Preset;
}

interface PromptAnswers extends Pick<CreateInput, 'name' | 'author' | 'description' | 'preset' | 'install'> {
  categoryChoice?: string;
  newCategory?: string;
}

type PromptType = 'select' | 'text' | 'confirm';

interface PromptQuestion {
  type: PromptType | ((previous: unknown, answers: PromptAnswers) => PromptType | null);
  name: keyof PromptAnswers;
  message: string;
  choices?: { title: string; value: string }[];
  initial?: string | boolean;
  validate?: (value: string) => boolean | string;
}

type Ask = (questions: PromptQuestion[], options: { onCancel: () => boolean }) => Promise<PromptAnswers>;
type Run = (command: string, args: string[], options: SpawnSyncOptions) => { status: number | null; error?: Error };

const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const BRAND = 'Bedrock Tweaks';
const HELP = `Usage: yarn run create [category[/subcategory...]] [addon_name] [description...] [options]

Omit details to answer interactive prompts.
  --author <name>       Author credit (defaults to git user.name)
  --description <text>  Addon description
  --preset <preset>      full, script, or resource (default: full)
  --install            Install dependencies at the repository root
  --yes                Use defaults without prompts; category and name are required
  --help               Show this help

Example: yarn run create gameplay_changes my_addon --author "Your Name"`;

export function parseArgs(args: string[]): CreateInput {
  const options: CreateInput = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--install') {
      options.install = true;
    } else if (arg === '--author' || arg === '--description' || arg === '--preset') {
      const value = args[++i];

      if (!value?.trim() || value.startsWith('--')) { throw new Error(`${arg} needs a value.`); }

      options[arg === '--author' ? 'author' : arg === '--description' ? 'description' : 'preset'] = value;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const [category, name, ...words] = positional;

  return { ...options, category, name, description: options.description ?? (words.length ? words.join(' ') : undefined) };
}

function isPreset(value: string): value is Preset {
  return value === 'full' || value === 'script' || value === 'resource';
}

export function validateInput(input: Pick<CreateInput, 'category' | 'name' | 'preset'>): asserts input is Pick<ScaffoldOptions, 'category' | 'name' | 'preset'> {
  const { category, name, preset = 'full' } = input;

  if (!category || !category.split('/').every(segment => NAME_RE.test(segment))) {
    throw new Error('Category must contain lowercase path segments, e.g. gameplay_changes or gameplay_changes/utility.');
  }

  if (!name || !NAME_RE.test(name)) { throw new Error('Addon name must start with a lowercase letter and contain only lowercase letters, digits and underscores.'); }

  if (!isPreset(preset)) { throw new Error('Preset must be full, script, or resource.'); }
}

export async function collectOptions(
  input: CreateInput,
  { base = root, interactive = Boolean(process.stdin.isTTY), ask = prompts }: { base?: string; interactive?: boolean; ask?: Ask } = {},
): Promise<ScaffoldOptions | undefined> {
  if (input.category && !input.category.split('/').every(segment => NAME_RE.test(segment))) { throw new Error('Invalid category.'); }

  if (input.name && !NAME_RE.test(input.name)) { throw new Error('Invalid addon name.'); }

  if (input.preset && !isPreset(input.preset)) { throw new Error('Invalid preset.'); }

  const gitName = spawnSync('git', ['config', 'user.name'], { cwd: base, encoding: 'utf8' }).stdout?.trim();
  const defaults = { author: gitName || BRAND, description: 'A Bedrock Tweaks addon.' };
  const selected = {
    ...input,
    author: input.author ?? defaults.author,
    description: input.description ?? defaults.description,
    preset: input.preset ?? 'full',
    install: input.install ?? false,
  };

  if (!input.yes && interactive) {
    const categoriesDir = path.join(base, 'addons', 'files');
    const categories = existsSync(categoriesDir) ? readdirSync(categoriesDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort() : [];
    const questions: PromptQuestion[] = [];

    if (!input.category) {
      questions.push({ type: 'select', name: 'categoryChoice', message: 'Addon category:', choices: [...categories.map(value => ({ title: value, value })), { title: 'New or nested category', value: '' }] });
      questions.push({ type: (_, values) => values.categoryChoice === '' ? 'text' : null, name: 'newCategory', message: 'Category path:', validate: value => value.split('/').every(segment => NAME_RE.test(segment)) || 'Use lowercase letters, digits and underscores in every segment.' });
    }

    if (!input.name) { questions.push({ type: 'text', name: 'name', message: 'Addon name:', validate: value => NAME_RE.test(value) || 'Use a lowercase name such as my_addon.' }); }

    if (!input.author) { questions.push({ type: 'text', name: 'author', message: 'Author:', initial: defaults.author, validate: value => Boolean(value.trim()) || 'Enter an author.' }); }

    if (!input.description) { questions.push({ type: 'text', name: 'description', message: 'Description:', initial: defaults.description, validate: value => Boolean(value.trim()) || 'Enter a description.' }); }

    if (!input.preset) { questions.push({ type: 'select', name: 'preset', message: 'Project preset:', choices: [{ title: 'Full Core addon with UI', value: 'full' }, { title: 'Behavior pack with scripts', value: 'script' }, { title: 'Resource pack', value: 'resource' }] }); }

    if (!input.install) { questions.push({ type: 'confirm', name: 'install', message: 'Install dependencies in the repository root?', initial: false }); }

    let cancelled = false;
    const answers = await ask(questions, { onCancel: () => {
      cancelled = true;

      return false;
    } });

    if (cancelled) { return undefined; }

    Object.assign(selected, answers);

    if (!input.category) { selected.category = answers.categoryChoice || answers.newCategory; }
  }

  if (!selected.category || !selected.name) { throw new Error(`Category and addon name are required without an interactive terminal.\n${HELP}`); }

  validateInput(selected);

  return selected;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJsonObject(file: string): Record<string, unknown> {
  const value: unknown = JSON.parse(readFileSync(file, 'utf8'));

  if (!isRecord(value)) { throw new Error(`Expected a JSON object in ${file}.`); }

  return value;
}

function existingPackage(directory: string, packageName: string): string | undefined {
  if (!existsSync(directory)) { return undefined; }

  const manifest = path.join(directory, 'package.json');

  if (existsSync(manifest) && readJsonObject(manifest).name === packageName) { return directory; }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || ['node_modules', 'build', 'dist'].includes(entry.name)) { continue; }

    const match = existingPackage(path.join(directory, entry.name), packageName);

    if (match) { return match; }
  }

  return undefined;
}

export function scaffold(
  options: ScaffoldOptions,
  { base = root, run = spawnSync }: { base?: string; run?: Run } = {},
): { targetDir: string; namespace: string; packageName: string } {
  validateInput(options);
  const { category, name, author, description, preset = 'full' } = options;
  const segments = category.split('/');
  const prefix = segments.map(segment => segment.split('_').map(word => word[0]).join('')).join('_');
  const projectName = `${prefix}_${name}`;
  const categoryDir = path.join(base, 'addons', 'files', ...segments);
  const scaffoldDir = path.join(categoryDir, projectName);
  const targetDir = path.join(categoryDir, name);

  if (existsSync(targetDir) || existsSync(scaffoldDir)) { throw new Error(`Addon directory already exists: ${targetDir} or ${scaffoldDir}`); }

  const duplicate = existingPackage(path.join(base, 'addons', 'files'), `@bedrock-tweaks/${name}`);

  if (duplicate) { throw new Error(`Workspace @bedrock-tweaks/${name} already exists: ${duplicate}`); }

  const cli = process.env.BEDROCK_CORE_CLI || require.resolve('@bedrock-core/cli/dist/index.js');

  mkdirSync(categoryDir, { recursive: true });
  const args = [cli, projectName, '--author', author, '--description', description, '--creator-id', 'bt', '--pack-id', projectName, '--preset', preset, '--package-manager', 'none'];
  const result = run(process.execPath, args, { cwd: categoryDir, stdio: 'inherit' });

  if (result.error || result.status !== 0 || !existsSync(scaffoldDir)) { throw new Error(`Core CLI failed to create the addon${result.error ? `: ${result.error.message}` : '.'}`); }

  renameSync(scaffoldDir, targetDir);

  // The parent workspace owns Git metadata and package-manager state.
  for (const file of ['.git', 'yarn.lock', '.yarnrc.yml', '.yarn']) { rmSync(path.join(targetDir, file), { recursive: true, force: true }); }

  const packagePath = path.join(targetDir, 'package.json');
  const pkg = readJsonObject(packagePath);
  const packageName = `@bedrock-tweaks/${name}`;

  pkg.name = packageName;
  pkg.private = true;
  delete pkg.packageManager;
  const scripts = pkg.scripts ?? {};

  if (!isRecord(scripts)) { throw new Error(`Expected a scripts object in ${packagePath}.`); }

  pkg.scripts = scripts;

  if (typeof scripts.typecheck === 'string') { scripts.typecheck = scripts.typecheck.replace('node node_modules/typescript-native/bin/tsc', 'tsc'); }

  for (const script of ['loopback', 'loopback:preview', 'bds:fetch', 'bds:where']) { delete scripts[script]; }

  if (typeof scripts['test:mc'] === 'string') { scripts['test:mc'] = scripts['test:mc'].replace('bc-bds run', 'yarn run -T bc-bds run'); }

  if (typeof scripts['build:optimized'] === 'string') { scripts['build:optimized'] = scripts['build:optimized'].replace('bc-bds optimize', 'yarn run -T bc-bds optimize'); }

  if (isRecord(pkg.devDependencies)) { delete pkg.devDependencies['@bedrock-core/bds-runner']; }

  writeFileSync(packagePath, `${JSON.stringify(pkg, null, '\t')}\n`);
  appendFileSync(path.join(targetDir, '.gitignore'), '\n# Downloaded shared UI resource pack\ncore-ui-*.mcpack\n');
  const configPath = path.join(targetDir, 'config.json');
  const config = readJsonObject(configPath);
  const authors = [...new Set([BRAND, author])];

  config.authors = authors;
  writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`);

  for (const pack of ['BP', 'RP']) {
    const file = path.join(targetDir, 'packs', pack, 'manifest.json');

    if (!existsSync(file)) { continue; }

    const manifest = readJsonObject(file);

    manifest.metadata = { ...(isRecord(manifest.metadata) ? manifest.metadata : {}), authors };
    writeFileSync(file, `${JSON.stringify(manifest, null, '\t')}\n`);
  }

  // Register every category level so nested addons are reachable from root Yarn.
  let parent = path.join(base, 'addons', 'files');

  for (const segment of [...segments, name]) {
    if (parent !== path.join(base, 'addons', 'files')) {
      const file = path.join(parent, 'package.json');
      const categoryPkg = existsSync(file) ? readJsonObject(file) : { private: true, workspaces: [] };
      const workspaces = categoryPkg.workspaces ?? [];

      if (!Array.isArray(workspaces) || !workspaces.every(entry => typeof entry === 'string')) {
        throw new Error(`Expected an array of workspaces in ${file}.`);
      }

      if (!workspaces.includes(segment)) { workspaces.push(segment); }

      categoryPkg.workspaces = workspaces.sort();
      writeFileSync(file, `${JSON.stringify(categoryPkg, null, '\t')}\n`);
    }

    parent = path.join(parent, segment);
  }

  return { targetDir, namespace: `bt_${projectName}`, packageName };
}

async function main(): Promise<void> {
  const input = parseArgs(process.argv.slice(2));

  if (input.help) {
    console.info(HELP);

    return;
  }

  const options = await collectOptions(input);

  if (!options) {
    console.info('Creation cancelled.');

    return;
  }

  const result = scaffold(options);

  if (options.install) {
    const yarn = process.env.npm_execpath;

    if (!yarn || !/yarn/i.test(yarn)) { throw new Error('Addon created. Run yarn install at the repository root to install dependencies.'); }

    const install = spawnSync(process.execPath, [yarn, 'install'], { cwd: root, stdio: 'inherit' });

    if (install.error || install.status !== 0) { throw new Error('Addon created; dependency installation failed. Run yarn install at the repository root.'); }
  }

  console.info(`\nCreated ${path.relative(root, result.targetDir)} (namespace ${result.namespace}).`);

  if (!options.install) { console.info('1. Run yarn install at the repository root.'); }

  const next = options.install ? 1 : 2;

  console.info(`${next}. Run yarn workspace ${result.packageName} build.`);
  console.info(`${next + 1}. Add '${options.name}' to addons/packs.json under '${options.category}'.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
