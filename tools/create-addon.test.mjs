import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { collectOptions, parseArgs, scaffold, validateInput } from './create-addon.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
function fixture(t) {
  const base = mkdtempSync(path.join(root, '.create-addon-test-'));
  t.after(() => {
    assert.ok(base.startsWith(path.join(root, '.create-addon-test-')));
    rmSync(base, { recursive: true, force: true });
  });
  return base;
}

test('positional invocation and flags preserve free text', () => {
  assert.deepEqual(parseArgs(['gameplay_changes', 'my_addon', 'Saves', 'drops', '--author', "O'Brien & Friends"]), {
    category: 'gameplay_changes', name: 'my_addon', description: 'Saves drops', author: "O'Brien & Friends",
  });
  assert.throws(() => parseArgs(['--author']), /needs a value/);
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
  for (const category of ['../escape', '/absolute', 'a//b', 'a\\b']) assert.throws(() => validateInput({ category, name: 'valid' }));
  assert.throws(() => validateInput({ category: 'valid', name: '../bad' }));
  assert.throws(() => validateInput({ category: 'valid', name: 'valid', preset: 'bad' }));
});

test('interactive mode asks for missing details and supports nested categories', async t => {
  const base = fixture(t);
  mkdirSync(path.join(base, 'addons', 'files', 'gameplay_changes'), { recursive: true });
  let seen;
  const result = await collectOptions({}, { base, interactive: true, ask: async questions => {
    seen = questions;
    return { categoryChoice: '', newCategory: 'gameplay_changes/utility', name: 'sample', author: "O'Brien", description: 'Sample addon', preset: 'script', install: false };
  } });
  assert.equal(result.category, 'gameplay_changes/utility');
  assert.equal(result.author, "O'Brien");
  assert.equal(seen.find(q => q.name === 'categoryChoice').choices[0].value, 'gameplay_changes');
  assert.ok(seen.find(q => q.name === 'name').validate('../escape') !== true);
  assert.equal(seen.find(q => q.name === 'newCategory').type(null, { categoryChoice: '' }), 'text');
});

test('cancellation creates nothing and noninteractive mode validates required fields', async t => {
  const base = fixture(t);
  const result = await collectOptions({}, { base, interactive: true, ask: async (_, { onCancel }) => { onCancel(); return {}; } });
  assert.equal(result, undefined);
  assert.equal(existsSync(path.join(base, 'addons')), false);
  await assert.rejects(collectOptions({}, { base, interactive: false }), /required/);
  const options = await collectOptions({ category: 'gameplay_changes', name: 'sample', yes: true }, { base, interactive: true, ask: () => assert.fail('must not prompt') });
  assert.equal(options.preset, 'full');
});

for (const preset of ['script', 'resource']) test(`published Core CLI scaffolds a ${preset} workspace`, t => {
  const base = fixture(t);
  const category = 'gameplay_changes/utility';
  const author = "O'Brien \\ \"Friends\" & $(literal)";
  const result = scaffold({ category, name: 'sample', author, description: 'A "quoted" description & $HOME', preset }, { base, run: (command, args, options) => spawnSync(command, args, { ...options, stdio: 'pipe', timeout: 30000 }) });
  assert.equal(result.namespace, 'bt_gc_u_sample');
  const config = json(path.join(result.targetDir, 'config.json'));
  assert.equal(config.namespace, result.namespace);
  assert.deepEqual(config.authors, ['Bedrock Tweaks', author]);
  assert.ok(config.bedrockCore.profiles.build);
  assert.equal(config.regolith, undefined);
  const pkg = json(path.join(result.targetDir, 'package.json'));
  assert.equal(pkg.name, '@bedrock-tweaks/sample');
  assert.equal(pkg.private, true);
  assert.match(pkg.scripts.build, /^bc-builder/);
  assert.equal(pkg.packageManager, undefined);
  assert.equal(existsSync(path.join(result.targetDir, '.git')), false);
  assert.equal(existsSync(path.join(result.targetDir, 'yarn.lock')), false);
  assert.deepEqual(json(path.join(base, 'addons/files/gameplay_changes/package.json')).workspaces, ['utility']);
  assert.deepEqual(json(path.join(base, 'addons/files/gameplay_changes/utility/package.json')).workspaces, ['sample']);
  assert.throws(() => scaffold({ category, name: 'sample', author, description: 'duplicate', preset }, { base }), /already exists/);
  assert.throws(() => scaffold({ category: 'another_category', name: 'sample', author, description: 'duplicate', preset }, { base }), /Workspace .* already exists/);
  assert.equal(existsSync(path.join(base, 'addons/files/another_category')), false);
});

test('a failed CLI leaves category registration untouched', t => {
  const base = fixture(t);
  assert.throws(() => scaffold({ category: 'new_category', name: 'sample', author: 'Author', description: 'Description' }, { base, run: () => ({ status: 1 }) }), /CLI failed/);
  assert.equal(existsSync(path.join(base, 'addons/files/new_category/package.json')), false);
});
