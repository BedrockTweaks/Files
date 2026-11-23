import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { checkIncompatibilities } from './index.mts';

async function fixture(t: test.TestContext, combinations: { id: string; combines: string[] }[] = []) {
  const prefix = join(tmpdir(), 'bt-incompatibility-test-');
  const root = await mkdtemp(prefix);
  t.after(async () => {
    assert.ok(root.startsWith(prefix));
    await rm(root, { recursive: true, force: true });
  });
  const put = async (path: string, contents = 'png') => {
    const target = join(root, 'resource_packs', path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  };
  await put('packs.json', JSON.stringify({
    categories: [{ id: 'category/nested', packs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] }],
    combinations,
  }));
  for (const pack of ['a', 'b', 'c']) await put(`files/category/nested/${pack}/pack_icon.png`, pack);
  for (const combination of combinations) await put(`${combination.id}/marker.txt`);
  return { root, put };
}

void test('reports shared output PNG paths once per pair, excluding metadata and other file types', async t => {
  const { root, put } = await fixture(t);
  for (const pack of ['a', 'b']) {
    await put(`files/category/nested/${pack}/textures/blocks/stone.png`, pack);
    await put(`files/category/nested/${pack}/textures/blocks/dirt.png`, pack);
    await put(`files/category/nested/${pack}/entity/sample.json`);
    await put(`files/category/nested/${pack}/textures/animated.gif`);
  }
  await put('files/category/nested/c/textures/items/stone.png');
  const result = await checkIncompatibilities(root);
  assert.equal(result.packsChecked, 3);
  assert.deepEqual(result.conflicts, [{
    packs: ['category/nested/a', 'category/nested/b'],
    files: ['textures/blocks/dirt.png', 'textures/blocks/stone.png'],
  }]);
});

void test('a two-pack combination covers its pair, but a three-pack combination needs its third pack', async t => {
  const { root, put } = await fixture(t, [
    { id: 'extras/ab', combines: ['category/nested/a', 'category/nested/b'] },
    { id: 'extras/abc', combines: ['category/nested/a', 'category/nested/b', 'category/nested/c'] },
  ]);
  for (const pack of ['a', 'b', 'c']) await put(`files/category/nested/${pack}/textures/shared.png`, pack);
  await put('extras/ab/textures/shared.png', 'ab');
  await put('extras/abc/textures/shared.png', 'abc');
  const result = await checkIncompatibilities(root);
  assert.deepEqual(result.conflicts.map(conflict => conflict.packs), [
    ['category/nested/a', 'category/nested/c'],
    ['category/nested/b', 'category/nested/c'],
  ]);
  assert.equal(result.conditionalResolutions.length, 2);
  const written = await checkIncompatibilities(root, { write: true });
  assert.deepEqual(written.changes, { added: [], removed: [] });
  assert.deepEqual(written.undeclaredConflicts, result.undeclaredConflicts);
});

void test('counts overlaps within each mutually exclusive subtree and reports overlaps across its boundary', async t => {
  const { root, put } = await fixture(t);
  await put('packs.json', JSON.stringify({
    categories: [
      { id: 'category/nested', mutuallyExclusive: true, packs: [{ id: 'a' }, { id: 'b' }] },
      { id: 'category/nested/other', packs: [{ id: 'c' }] },
      { id: 'category/nested/middle/leaf', mutuallyExclusive: true, packs: [{ id: 'e' }] },
      { id: 'category/nested_other', packs: [{ id: 'd' }] },
    ],
    combinations: [],
  }));
  for (const pack of ['category/nested/a', 'category/nested/b', 'category/nested/other/c', 'category/nested/middle/leaf/e', 'category/nested_other/d']) {
    await put(`files/${pack}/textures/shared.png`, pack);
    await put(`files/${pack}/textures/shared2.png`, pack);
  }
  const report = await checkIncompatibilities(root);
  assert.equal(report.pairsCoveredByExclusiveCategories, 6);
  assert.deepEqual(report.conflicts.map(conflict => conflict.packs), [
    ['category/nested/a', 'category/nested_other/d'],
    ['category/nested/b', 'category/nested_other/d'],
    ['category/nested/middle/leaf/e', 'category/nested_other/d'],
    ['category/nested/other/c', 'category/nested_other/d'],
  ]);
});

void test('accepts literal category declarations for descendants and rejects glob patterns', async t => {
  const { root, put } = await fixture(t);
  const source = { id: 'dragon', incompatibilities: ['colors/elytra/'] };
  const catalog = {
    categories: [
      { id: 'aesthetic', packs: [source] },
      { id: 'colors/elytra', packs: [{ id: 'blue' }] },
      { id: 'colors/elytra/shades', packs: [{ id: 'navy' }] },
      { id: 'colors/elytra_extra', packs: [{ id: 'rainbow' }] },
    ],
    combinations: [],
  };
  await put('packs.json', JSON.stringify(catalog));
  for (const pack of ['aesthetic/dragon', 'colors/elytra/blue', 'colors/elytra/shades/navy', 'colors/elytra_extra/rainbow']) {
    await put(`files/${pack}/textures/shared.png`, pack);
  }
  const report = await checkIncompatibilities(root);
  const dragonConflicts = report.undeclaredConflicts.filter(({ packs }) => packs.includes('aesthetic/dragon'));
  assert.deepEqual(dragonConflicts.map(({ packs }) => packs), [['aesthetic/dragon', 'colors/elytra_extra/rainbow']]);

  source.incompatibilities = ['colors/*/'];
  await put('packs.json', JSON.stringify(catalog));
  await assert.rejects(checkIncompatibilities(root), { message: 'Invalid incompatibility on aesthetic/dragon: colors/*/' });
});

void test('ignores identical files and checks what a combination actually covers', async t => {
  const { root, put } = await fixture(t, [
    { id: 'extras/ab', combines: ['category/nested/a', 'category/nested/b'] },
  ]);
  for (const pack of ['a', 'b']) {
    await put(`files/category/nested/${pack}/textures/identical.png`, 'same');
    await put(`files/category/nested/${pack}/textures/combined.png`, pack);
    await put(`files/category/nested/${pack}/textures/uncovered.png`, pack);
  }
  await put('extras/ab/textures/combined.png', 'merged');
  const { conflicts } = await checkIncompatibilities(root);
  assert.deepEqual(conflicts.map(conflict => conflict.files), [['textures/uncovered.png']]);
});

void test('accepts only listed PNG paths for Sticky Piston Sides and slime colors', async t => {
  const { root, put } = await fixture(t);
  const piston = 'utility/sticky_piston_sides';
  const redSlime = 'world_of_color/slimes/red_slime';
  const similarCategoryPack = 'world_of_color/slimes_extra/other_slime';
  const pistonTexture = 'textures/blocks/piston_side_sticky.png';
  const unrelatedTexture = 'textures/blocks/unrelated.png';
  await put('packs.json', JSON.stringify({
    categories: [
      { id: 'utility', packs: [{ id: 'sticky_piston_sides', incompatibilities: [redSlime] }] },
      { id: 'world_of_color/slimes', packs: [{ id: 'red_slime' }] },
      { id: 'world_of_color/slimes_extra', packs: [{ id: 'other_slime' }] },
    ],
    combinations: [],
  }));
  for (const pack of [piston, redSlime]) {
    await put(`files/${pack}/${pistonTexture}`, pack);
    await put(`files/${pack}/${unrelatedTexture}`, pack);
  }
  await put(`files/${similarCategoryPack}/${pistonTexture}`, similarCategoryPack);
  const report = await checkIncompatibilities(root);
  assert.equal(report.compatibleOverlaps.length, 1);
  const [accepted] = report.compatibleOverlaps;
  assert.deepEqual(accepted.packs, [piston, redSlime]);
  assert.deepEqual(accepted.files, [pistonTexture]);
  assert.match(accepted.reason, /higher priority/);
  assert.deepEqual(report.conflicts, [
    { packs: [piston, redSlime], files: [unrelatedTexture] },
    { packs: [piston, similarCategoryPack], files: [pistonTexture] },
    { packs: [redSlime, similarCategoryPack], files: [pistonTexture] },
  ]);
  assert.deepEqual(report.undeclaredConflicts, report.conflicts.slice(1));
});

void test('reports missing catalog pack directories without hiding conflicts in the rest of the catalog', async t => {
  const { root } = await fixture(t);
  await writeFile(join(root, 'resource_packs', 'packs.json'), JSON.stringify({
    categories: [{ id: 'category', packs: [{ id: 'missing' }] }], combinations: [],
  }));
  const report = await checkIncompatibilities(root);
  assert.deepEqual(report.missingPacks, ['category/missing']);
  assert.equal(report.packsScanned, 0);
});

void test('a missing combination folder is reported and does not suppress a conflict', async t => {
  const { root, put } = await fixture(t);
  await put('packs.json', JSON.stringify({
    categories: [{ id: 'category/nested', packs: [{ id: 'a' }, { id: 'b' }] }],
    combinations: [{ id: 'extras/missing', combines: ['category/nested/a', 'category/nested/b'] }],
  }));
  for (const pack of ['a', 'b']) await put(`files/category/nested/${pack}/textures/shared.png`, pack);
  const report = await checkIncompatibilities(root);
  assert.deepEqual(report.missingCombinations, ['extras/missing']);
  assert.equal(report.conflicts.length, 1);
});

void test('writes detected conflicts, removes resolved pairs, and prunes other stale entries on request', async t => {
  const a = 'category/nested/a';
  const b = 'category/nested/b';
  const c = 'category/nested/c';
  const d = 'category/extra/d';
  const combination = { id: 'extras/ab', combines: [a, b] };
  const conditional = { id: 'extras/acd', combines: [a, c, d], resolvesIncompatibilities: [[a, d]] };
  const { root, put } = await fixture(t, [combination, conditional]);
  const catalog = {
    categories: [
      { id: 'category/nested', packs: [
        { id: 'a', incompatibilities: [b, d], name: 'Pack A' },
        { id: 'b', incompatibilities: [c, 'category/extra/'] },
        { id: 'c' },
      ] },
      { id: 'category/extra', packs: [{ id: 'd' }] },
    ],
    combinations: [combination, conditional],
    extraMetadata: ['keep', 'format'],
  };
  const source = JSON.stringify(catalog, null, '\t')
    .replace(/"extraMetadata": \[[\s\S]*?\]/, '"extraMetadata": ["keep", "format"]')
    .replaceAll('\n', '\r\n');
  await put('packs.json', source);
  await put(`files/${d}/pack_icon.png`);
  await put(`files/${a}/textures/resolved.png`, a);
  await put(`files/${b}/textures/resolved.png`, b);
  await put('extras/ab/textures/resolved.png', 'merged');
  await put(`files/${a}/textures/conflict.png`, a);
  await put(`files/${c}/textures/conflict.png`, c);

  const catalogPath = join(root, 'resource_packs', 'packs.json');
  const scanned = await checkIncompatibilities(root);
  assert.equal(scanned.undeclaredConflicts.length, 1);
  assert.equal(await readFile(catalogPath, 'utf8'), source);

  const written = await checkIncompatibilities(root, { write: true });
  assert.deepEqual(written.changes, { added: [[a, c]], removed: [[a, b]] });
  assert.deepEqual(written.undeclaredConflicts, []);
  const updatedSource = await readFile(catalogPath, 'utf8');
  catalog.categories[0].packs[0].incompatibilities = [d, c];
  assert.deepEqual(JSON.parse(updatedSource), catalog);
  assert.match(updatedSource, /"extraMetadata": \["keep", "format"\]/);
  assert.doesNotMatch(updatedSource, /(?<!\r)\n/);

  const pruned = await checkIncompatibilities(root, { write: true, prune: true });
  assert.deepEqual(pruned.changes, { added: [], removed: [[b, c]] });
  catalog.categories[0].packs[1].incompatibilities = ['category/extra/'];
  const prunedSource = await readFile(catalogPath, 'utf8');
  assert.deepEqual(JSON.parse(prunedSource), catalog);
  assert.deepEqual((await checkIncompatibilities(root, { write: true, prune: true })).changes, { added: [], removed: [] });
  assert.equal(await readFile(catalogPath, 'utf8'), prunedSource);
});

void test('writes unaffected pairs and keeps declarations for missing packs or combinations', async t => {
  const a = 'category/nested/a';
  const b = 'category/nested/b';
  const c = 'category/nested/c';
  const missing = 'category/nested/missing';
  const { root, put } = await fixture(t);
  await put('packs.json', JSON.stringify({
    categories: [{ id: 'category/nested', packs: [
      { id: 'a', incompatibilities: [missing] }, { id: 'b' }, { id: 'c' }, { id: 'missing' },
    ] }],
    combinations: [{ id: 'extras/missing', combines: [a, b] }],
  }));
  await put(`files/${a}/textures/possibly_resolved.png`, a);
  await put(`files/${b}/textures/possibly_resolved.png`, b);
  await put(`files/${a}/textures/conflict.png`, a);
  await put(`files/${c}/textures/conflict.png`, c);

  const report = await checkIncompatibilities(root, { write: true, prune: true });
  assert.deepEqual(report.changes, { added: [[a, c]], removed: [] });
  assert.deepEqual(report.undeclaredConflicts.map(conflict => conflict.packs), [[a, b]]);
  const updatedCatalog = JSON.parse(await readFile(join(root, 'resource_packs', 'packs.json'), 'utf8')) as {
    categories: { packs: { incompatibilities?: string[] }[] }[];
  };
  assert.deepEqual(updatedCatalog.categories[0].packs[0].incompatibilities, [missing, c]);
});

void test('rejects catalog paths outside resource_packs', async t => {
  const { root } = await fixture(t);
  await writeFile(join(root, 'resource_packs', 'packs.json'), JSON.stringify({
    categories: [{ id: '../../outside', packs: [{ id: 'pack' }] }], combinations: [],
  }));
  await assert.rejects(checkIncompatibilities(root), /Cannot scan resource pack/);
});
