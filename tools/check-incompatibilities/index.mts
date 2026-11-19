#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyEdits, modify } from 'jsonc-parser';
import { compatibleOverlapRules } from './compatible-overlaps.mts';

interface CatalogCategory {
  id: string;
  mutuallyExclusive?: boolean;
  packs: { id: string; incompatibilities?: string[] }[];
}

interface Catalog {
  categories: CatalogCategory[];
  combinations: { id: string; combines: string[]; resolvesIncompatibilities?: [string, string][] }[];
}

export interface Conflict {
  packs: [string, string];
  files: string[];
}

export interface IncompatibilityReport {
  /** Catalog section scanned by the checker. */
  section: 'resource_packs';
  /** Total packs listed in the catalog. */
  packsChecked: number;
  /** Packs whose source directories were scanned successfully. */
  packsScanned: number;
  /** Distinct PNG paths across scanned packs, excluding pack icons. */
  pngPathsChecked: number;
  /** Pack paths whose source directories could not be found. */
  missingPacks: string[];
  /** Combination IDs whose source directories could not be found. */
  missingCombinations: string[];
  /** Overlapping pack pairs that share a mutually exclusive category root. */
  pairsCoveredByExclusiveCategories: number;
  /** PNG overlaps accepted by explicit compatibility rules, with their reasons. */
  compatibleOverlaps: (Conflict & { reason: string })[];
  /** Pack pairs with unresolved PNG overlaps, including already declared pairs. */
  conflicts: Conflict[];
  /** Conflicts that still lack a matching pack or category declaration after any writes. */
  undeclaredConflicts: Conflict[];
  /** Combinations of three or more packs whose PNGs cover every conflict for a pair. */
  conditionalResolutions: { combination: string; packs: [string, string] }[];
  /** Direct declarations added or removed by --write, as source and target pack paths. */
  changes?: { added: Conflict['packs'][]; removed: Conflict['packs'][] };
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const pairKey = (a: string, b: string): string => JSON.stringify([a, b].sort(compare));

function matchesPackReference(reference: string, pack: string): boolean {
  return reference.endsWith('/') ? pack.startsWith(reference) : pack === reference;
}

function compatibleOverlapReason(a: string, b: string, file: string): string | undefined {
  return compatibleOverlapRules.find(({ packs: [first, second], files }) =>
    files.includes(file) && (
      (matchesPackReference(first, a) && matchesPackReference(second, b))
      || (matchesPackReference(first, b) && matchesPackReference(second, a))
    ),
  )?.reason;
}

function within(root: string, path: string): string {
  const target = resolve(root, path);
  const suffix = relative(root, target);
  if (isAbsolute(suffix) || suffix === '..' || suffix.startsWith(`..${sep}`)) {
    throw new Error(`Catalog path escapes resource_packs: ${path}`);
  }
  return target;
}

async function pngFiles(root: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await pngFiles(root, path));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png') && entry.name !== 'pack_icon.png') {
      files.push(path);
    }
  }
  return files.sort(compare);
}

/** Reports PNG overlaps for selectable pairs, with optional catalog updates. */
export async function checkIncompatibilities(
  root = repositoryRoot,
  { write = false, prune = false } = {},
): Promise<IncompatibilityReport> {
  const resourceRoot = resolve(root, 'resource_packs');
  const catalogPath = join(resourceRoot, 'packs.json');
  const catalogSource = await readFile(catalogPath, 'utf8');
  const catalog: Catalog = JSON.parse(catalogSource);
  const exclusiveCategories = catalog.categories.filter(category => category.mutuallyExclusive)
    .sort((a, b) => a.id.length - b.id.length);
  const packEntries = catalog.categories.flatMap(category => {
    const root = exclusiveCategories.find(candidate => category.id === candidate.id || category.id.startsWith(`${candidate.id}/`));
    return category.packs.map(pack => [`${category.id}/${pack.id}`, root] as const);
  });
  const exclusiveRootByPack = new Map<string, CatalogCategory | undefined>(packEntries);
  if (exclusiveRootByPack.size !== packEntries.length) throw new Error('Resource pack catalog contains duplicate pack paths.');
  const packs = [...exclusiveRootByPack.keys()].sort(compare);
  const declarations = new Set<string>();
  for (const category of catalog.categories) {
    for (const pack of category.packs) {
      const path = `${category.id}/${pack.id}`;
      for (const reference of pack.incompatibilities ?? []) {
        const targets = reference.endsWith('/')
          ? packs.filter(target => matchesPackReference(reference, target))
          : [reference].filter(target => target !== path && exclusiveRootByPack.has(target));
        if (targets.length === 0) {
          throw new Error(`Invalid incompatibility on ${path}: ${reference}`);
        }
        for (const target of targets) {
          if (target !== path) declarations.add(pairKey(path, target));
        }
      }
    }
  }

  const pngOwners = new Map<string, string[]>();
  const missingPacks: string[] = [];
  const missingCombinations: string[] = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(8, packs.length) }, async () => {
    while (cursor < packs.length) {
      const pack = packs[cursor++];
      let files: string[];
      try {
        files = await pngFiles(within(resourceRoot, `files/${pack}`));
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          missingPacks.push(pack);
          continue;
        }
        throw new Error(`Cannot scan resource pack ${pack}`, { cause: error });
      }
      for (const file of files) {
        const owners = pngOwners.get(file) ?? [];
        owners.push(pack);
        pngOwners.set(file, owners);
      }
    }
  }));

  const twoPackCombinations = new Map<string, Set<string>>();
  const largerCombinations: { id: string; combines: string[]; files: Set<string> }[] = [];
  for (const combination of catalog.combinations) {
    if (combination.combines.length < 2 || new Set(combination.combines).size !== combination.combines.length) continue;
    if (!combination.combines.every(pack => exclusiveRootByPack.has(pack))) continue;
    let files: string[];
    try {
      files = await pngFiles(within(resourceRoot, combination.id));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        missingCombinations.push(combination.id);
        continue;
      }
      throw error;
    }
    if (combination.combines.length === 2) {
      const key = pairKey(combination.combines[0], combination.combines[1]);
      const covered = twoPackCombinations.get(key) ?? new Set<string>();
      for (const file of files) covered.add(file);
      twoPackCombinations.set(key, covered);
    } else {
      largerCombinations.push({ ...combination, files: new Set(files) });
    }
  }

  const conflicts = new Map<string, Conflict>();
  const acceptedOverlaps = new Map<string, Conflict & { reason: string }>();
  const categoryCoveredPairs = new Set<string>();
  const contents = new Map<string, Promise<Buffer>>();
  const readAsset = (pack: string, file: string): Promise<Buffer> => {
    const path = within(resourceRoot, `files/${pack}/${file}`);
    const cached = contents.get(path) ?? readFile(path);
    contents.set(path, cached);
    return cached;
  };
  for (const [file, owners] of [...pngOwners.entries()].sort(([a], [b]) => compare(a, b))) {
    owners.sort(compare);
    for (let i = 0; i < owners.length; i++) {
      const root = exclusiveRootByPack.get(owners[i]);
      for (let j = i + 1; j < owners.length; j++) {
        const a = owners[i];
        const b = owners[j];
        const key = pairKey(a, b);
        if (twoPackCombinations.get(key)?.has(file)) continue;
        if (root && root === exclusiveRootByPack.get(b)) {
          categoryCoveredPairs.add(key);
          continue;
        }
        const reason = compatibleOverlapReason(a, b, file);
        if (reason) {
          const overlapKey = JSON.stringify([key, reason]);
          const overlap = acceptedOverlaps.get(overlapKey) ?? { packs: [a, b], files: [], reason };
          overlap.files.push(file);
          acceptedOverlaps.set(overlapKey, overlap);
          continue;
        }
        const [first, second] = await Promise.all([readAsset(a, file), readAsset(b, file)]);
        if (first.equals(second)) continue;
        const conflict = conflicts.get(key) ?? { packs: [a, b], files: [] };
        conflict.files.push(file);
        conflicts.set(key, conflict);
      }
    }
  }

  const sortedConflicts = [...conflicts.values()].sort((a, b) => compare(pairKey(...a.packs), pairKey(...b.packs)));
  const conditionalResolutions = largerCombinations.flatMap(({ id, combines, files }) =>
    sortedConflicts
      .filter(conflict => conflict.packs.every(pack => combines.includes(pack)) && conflict.files.every(file => files.has(file)))
      .map(conflict => ({ combination: id, packs: conflict.packs })),
  );

  const report: IncompatibilityReport = {
    section: 'resource_packs',
    packsChecked: packs.length,
    packsScanned: packs.length - missingPacks.length,
    pngPathsChecked: pngOwners.size,
    missingPacks: missingPacks.sort(compare),
    missingCombinations: missingCombinations.sort(compare),
    pairsCoveredByExclusiveCategories: categoryCoveredPairs.size,
    compatibleOverlaps: [...acceptedOverlaps.values()],
    conflicts: sortedConflicts,
    undeclaredConflicts: sortedConflicts.filter(conflict => !declarations.has(pairKey(...conflict.packs))),
    conditionalResolutions,
  };

  if (write) {
    const coveredPairs = new Set([
      ...twoPackCombinations.keys(),
      ...categoryCoveredPairs,
      ...report.compatibleOverlaps.map(overlap => pairKey(...overlap.packs)),
    ]);
    const { updatedSource, changes } = updateDeclarations(catalogSource, catalog, report, coveredPairs, prune);
    if (updatedSource !== catalogSource) {
      await saveCatalog(catalogPath, catalogSource, updatedSource);
    }
    const addedPairs = new Set(changes.added.map(pair => pairKey(...pair)));
    report.undeclaredConflicts = report.undeclaredConflicts.filter(({ packs }) => !addedPairs.has(pairKey(...packs)));
    report.changes = changes;
  }

  return report;
}

function updateDeclarations(
  source: string,
  catalog: Catalog,
  report: IncompatibilityReport,
  coveredPairs: Set<string>,
  prune: boolean,
): { updatedSource: string; changes: NonNullable<IncompatibilityReport['changes']> } {
  const conflicts = new Set(report.conflicts.map(conflict => pairKey(...conflict.packs)));
  const resolutionsByCombination = new Map(catalog.combinations.map(combination => [
    combination.id,
    new Set((combination.resolvesIncompatibilities ?? []).map(pair => pairKey(...pair))),
  ]));
  const resolvedDeclarations = new Set([...resolutionsByCombination.values()].flatMap(pairs => [...pairs]));
  const missingPacks = new Set(report.missingPacks);
  const missingCombinations = new Set(report.missingCombinations);
  const incompletePairs = new Set(catalog.combinations
    .filter(combination => missingCombinations.has(combination.id))
    .flatMap(({ combines }) => combines.flatMap((pack, index) =>
      combines.slice(index + 1).map(target => pairKey(pack, target)),
    )));
  const pairsNeedingResolution = new Set(report.conditionalResolutions
    .filter(({ combination, packs }) => !resolutionsByCombination.get(combination)?.has(pairKey(...packs)))
    .map(({ packs }) => pairKey(...packs)));
  const additions = new Map<string, string[]>();
  const changes: NonNullable<IncompatibilityReport['changes']> = { added: [], removed: [] };
  for (const { packs: [pack, target] } of report.undeclaredConflicts) {
    const key = pairKey(pack, target);
    if (incompletePairs.has(key) || pairsNeedingResolution.has(key)) continue;

    const targets = additions.get(pack) ?? [];
    targets.push(target);
    additions.set(pack, targets);
    changes.added.push([pack, target]);
  }

  const indent = source.match(/\r?\n([ \t]+)"/)?.[1] ?? '\t';
  const formattingOptions = { insertSpaces: !indent.includes('\t'), tabSize: indent.length, eol: source.includes('\r\n') ? '\r\n' : '\n' };
  let updatedSource = source;
  for (const [categoryIndex, category] of catalog.categories.entries()) {
    for (const [packIndex, pack] of category.packs.entries()) {
      const path = `${category.id}/${pack.id}`;
      const existing = pack.incompatibilities ?? [];
      const next = existing.filter(target => {
        const key = pairKey(path, target);
        if (target.endsWith('/') || missingPacks.has(path) || missingPacks.has(target) || incompletePairs.has(key)
          || conflicts.has(key) || resolvedDeclarations.has(key) || (!prune && !coveredPairs.has(key))) {
          return true;
        }
        changes.removed.push([path, target]);
        return false;
      });
      const added = additions.get(path) ?? [];
      if (next.length === existing.length && added.length === 0) continue;

      next.push(...added);
      const edits = modify(updatedSource, ['categories', categoryIndex, 'packs', packIndex, 'incompatibilities'], next.length ? next : undefined, {
        formattingOptions,
        getInsertionIndex: keys => keys.indexOf('id') + 1,
      });
      updatedSource = applyEdits(updatedSource, edits);
    }
  }

  return { updatedSource, changes };
}

async function saveCatalog(path: string, original: string, updated: string): Promise<void> {
  const temporary = join(dirname(path), `.packs-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, updated, { flag: 'wx' });
    if (await readFile(path, 'utf8') !== original) {
      throw new Error('packs.json changed during the scan. Run the checker again.');
    }
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function main(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node tools/check-incompatibilities/index.mts [--write [--prune]]
Reports resource-pack PNG overlaps and catalog declarations as JSON.
--write adds detected conflicts and removes direct declarations covered by compatibility rules, categories, or combinations.
--prune also removes direct declarations without detected conflicts. Review the catalog diff for manually declared conflicts.
Record intentional PNG overlaps in tools/check-incompatibilities/compatible-overlaps.mts.
Exit codes: 0 = all conflicts declared, 1 = undeclared conflicts, 2 = scan incomplete or failed.`);
    return;
  }
  const unknown = args.find(arg => !['--write', '--prune'].includes(arg));
  if (unknown) throw new Error(`Unknown option: ${unknown}`);
  const write = args.includes('--write');
  const prune = args.includes('--prune');
  if (prune && !write) throw new Error('--prune requires --write.');

  const report = await checkIncompatibilities(repositoryRoot, { write, prune });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.missingPacks.length || report.missingCombinations.length ? 2 : report.undeclaredConflicts.length ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 2;
  });
}
