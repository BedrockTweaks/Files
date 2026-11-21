import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { type TestContext } from 'node:test';
import { collectOptions, parseArgs, scaffold, validateInput } from './index.mts';

interface PackManifest {
  namespace: string;
  metadata: { authors: string[] };
  modules: { type: string; entry?: string }[];
  dependencies: { uuid?: string; version: string | number[] }[];
}

interface BuilderConfig {
  $schema: string;
  namespace?: string;
  packs: Record<string, string>;
  authors: string[];
  bedrockCore: { profiles: Record<string, unknown> };
  regolith?: unknown;
}

interface WorkspacePackage {
  name: string;
  private: boolean;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager?: string;
  workspaces?: string[];
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function json<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function fixture(t: TestContext) {
  const base = mkdtempSync(path.join(root, '.create-test-'));
  t.after(() => {
    assert.ok(base.startsWith(path.join(root, '.create-test-')));
    rmSync(base, { recursive: true, force: true });
  });
  return base;
}

void test('positional invocation and flags preserve free text', () => {
  assert.deepEqual(parseArgs(['gameplay_changes', 'my_addon', 'Saves', 'drops', '--author', "O'Brien & Friends"]), {
    category: 'gameplay_changes', name: 'my_addon', description: 'Saves drops', author: "O'Brien & Friends",
  });
  assert.throws(() => parseArgs(['--author']), /needs a value/);
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
  for (const category of ['../escape', '/absolute', 'a//b', 'a\\b']) assert.throws(() => validateInput({ category, name: 'valid' }));
  assert.throws(() => validateInput({ category: 'valid', name: '../bad' }));
  assert.throws(() => validateInput({ category: 'valid', name: 'valid', preset: 'bad' }));
});

void test('interactive mode asks for missing details and supports nested categories', async t => {
  const base = fixture(t);
  mkdirSync(path.join(base, 'addons', 'files', 'gameplay_changes'), { recursive: true });
  const result = await collectOptions({}, { base, interactive: true, ask: questions => {
    assert.equal(questions.find(q => q.name === 'categoryChoice')?.choices?.[0]?.value, 'gameplay_changes');
    const validateName = questions.find(q => q.name === 'name')?.validate;
    assert.ok(validateName);
    assert.notEqual(validateName('../escape'), true);
    const categoryQuestion = questions.find(q => q.name === 'newCategory')?.type;
    assert.equal(typeof categoryQuestion === 'function' && categoryQuestion(null, { categoryChoice: '' }), 'text');
    return Promise.resolve({ categoryChoice: '', newCategory: 'gameplay_changes/utility', name: 'sample', author: "O'Brien", description: 'Sample addon', preset: 'script', install: false });
  } });
  assert.ok(result);
  assert.equal(result.category, 'gameplay_changes/utility');
  assert.equal(result.author, "O'Brien");
});

void test('cancellation creates nothing and noninteractive mode validates required fields', async t => {
  const base = fixture(t);
  const result = await collectOptions({}, { base, interactive: true, ask: (_, { onCancel }) => {
    onCancel();
    return Promise.resolve({});
  } });
  assert.equal(result, undefined);
  assert.equal(existsSync(path.join(base, 'addons')), false);
  await assert.rejects(collectOptions({}, { base, interactive: false }), /required/);
  const options = await collectOptions({ category: 'gameplay_changes', name: 'sample', yes: true }, { base, interactive: true, ask: () => assert.fail('must not prompt') });
  assert.ok(options);
  assert.equal(options.preset, 'full');
});

for (const preset of ['full', 'script', 'resource'] as const) void test(`published Core CLI scaffolds a ${preset} workspace`, t => {
  const base = fixture(t);
  const offline = path.join(base, 'offline.mjs');
  writeFileSync(offline, "import https from 'node:https';\nhttps.get = () => { throw new Error('Network disabled by scaffold test'); };\n");
  const category = 'gameplay_changes/utility';
  const author = "O'Brien \\ \"Friends\" & $(literal)";
  const result = scaffold({ category, name: 'sample', author, description: 'A "quoted" description & $HOME', preset }, { base, run: (command, args, options) => spawnSync(command, ['--import', pathToFileURL(offline).href, ...args], { ...options, stdio: 'pipe', timeout: 30000 }) });
  assert.equal(result.namespace, 'bt_gc_u_sample');
  const config = json<BuilderConfig>(path.join(result.targetDir, 'config.json'));
  assert.equal(config.$schema, 'https://bedrock-core.drav.dev/schemas/builder/beta/config.schema.json');
  assert.equal(config.namespace, undefined);
  for (const pack of Object.values(config.packs)) {
    const manifest = json<PackManifest>(path.join(result.targetDir, pack, 'manifest.json'));
    assert.equal(manifest.namespace, result.namespace);
    assert.deepEqual(manifest.metadata.authors, ['Bedrock Tweaks', author]);
  }
  assert.deepEqual(config.authors, ['Bedrock Tweaks', author]);
  assert.ok(config.bedrockCore.profiles.build);
  assert.equal(config.regolith, undefined);
  const pkg = json<WorkspacePackage>(path.join(result.targetDir, 'package.json'));
  assert.equal(pkg.name, '@bedrock-tweaks/sample');
  assert.equal(pkg.private, true);
  assert.match(pkg.scripts.build, /^bc-builder/);
  assert.equal(pkg.devDependencies['@bedrock-core/bds-runner'], undefined);
  assert.match(pkg.scripts['build:optimized'], /yarn run -T bc-bds optimize/);
  if (preset !== 'resource') {
    assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
    assert.match(pkg.scripts['test:mc'], /yarn run -T bc-bds run/);
    const manifest = json<PackManifest>(path.join(result.targetDir, 'packs/BP/manifest.json'));
    const testManifest = json<PackManifest>(path.join(result.targetDir, 'packs/BP/manifest.test.json'));
    assert.equal(manifest.modules.find(module => module.type === 'script')?.entry, 'scripts/main.ts');
    assert.equal(testManifest.modules.find(module => module.type === 'script')?.entry, 'scripts/gametest.ts');
  }
  if (preset === 'full') {
    const tsconfig = json<{ include: string[] }>(path.join(result.targetDir, 'tsconfig.json'));
    assert.ok(tsconfig.include.includes('packs/BP/ui/**/*'));
    assert.ok(existsSync(path.join(result.targetDir, 'packs/BP/ui/home.screen.tsx')));
    assert.ok(existsSync(path.join(result.targetDir, 'packs/BP/i18n/index.ts')));
    assert.equal(existsSync(path.join(result.targetDir, 'packs/BP/scripts/UI')), false);
    const manifest = json<PackManifest>(path.join(result.targetDir, 'packs/BP/manifest.json'));
    assert.equal(manifest.dependencies.find(dependency => dependency.uuid === '761ecd37-ad1c-4a64-862a-d6cc38767426')?.version, `1.${pkg.dependencies['@bedrock-core/ui'].split('.').slice(1).join('.')}`);
  }
  if (preset === 'script') {
    const check = spawnSync(process.execPath, ['--run', 'typecheck'], { cwd: result.targetDir, encoding: 'utf8', timeout: 30000 });
    assert.equal(check.status, 0, check.stdout + check.stderr);
  }
  assert.equal(pkg.packageManager, undefined);
  assert.equal(existsSync(path.join(result.targetDir, '.git')), false);
  assert.equal(existsSync(path.join(result.targetDir, 'yarn.lock')), false);
  assert.deepEqual(json<WorkspacePackage>(path.join(base, 'addons/files/gameplay_changes/package.json')).workspaces, ['utility']);
  assert.deepEqual(json<WorkspacePackage>(path.join(base, 'addons/files/gameplay_changes/utility/package.json')).workspaces, ['sample']);
  assert.throws(() => scaffold({ category, name: 'sample', author, description: 'duplicate', preset }, { base }), /already exists/);
  assert.throws(() => scaffold({ category: 'another_category', name: 'sample', author, description: 'duplicate', preset }, { base }), /Workspace .* already exists/);
  assert.equal(existsSync(path.join(base, 'addons/files/another_category')), false);
});

void test('a failed CLI leaves category registration untouched', t => {
  const base = fixture(t);
  assert.throws(() => scaffold({ category: 'new_category', name: 'sample', author: 'Author', description: 'Description' }, { base, run: () => ({ status: 1 }) }), /CLI failed/);
  assert.equal(existsSync(path.join(base, 'addons/files/new_category/package.json')), false);
});
