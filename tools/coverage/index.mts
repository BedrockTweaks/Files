import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { join } from 'node:path';

interface CatalogPack {
  id: string;
  name?: string;
  disabled?: boolean;
}

interface Catalog {
  version: number[];
  categories: { id: string; packs: CatalogPack[] }[];
}

interface VanillaPack {
  name: string;
  display?: string;
}

interface VanillaCategory {
  packs?: VanillaPack[];
  categories?: VanillaCategory[];
}

const root = join(import.meta.dirname, '../..');
const vanillaVersion = '26.2';
const comparisonSections = [
  { id: 'resource_packs', name: 'Resource Packs', kind: 'rp' },
  { id: 'addons', name: 'Addons', kind: 'dp' },
  { id: 'crafting_tweaks', name: 'Crafting Tweaks', kind: 'ct' },
] as const;

type ComparisonSection = (typeof comparisonSections)[number];

interface SectionComparison {
  id: ComparisonSection['id'];
  name: ComparisonSection['name'];
  coverage: {
    vanillaTweaksCatalog: string;
    bedrockCatalogVersion: string;
    vanillaTweaksCount: number;
    matchedVanillaTweaksCount: number;
    coveragePercent: number;
    bedrockCatalogCount: number;
    availableBedrockPacksCount: number;
    missingVanillaTweaksCount: number;
    extraBedrockPacksCount: number;
    missingVanillaTweaksPacks: { id: string; name: string }[];
    extraBedrockPacks: { path: string; name: string }[];
  };
}

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

async function readCatalog(section: string): Promise<{
  catalog: Catalog;
  available: (CatalogPack & { path: string })[];
  total: number;
}> {
  const catalog: Catalog = JSON.parse(await readFile(join(root, section, 'packs.json'), 'utf8'));
  const packs = catalog.categories.flatMap(category => category.packs.map(pack => ({
    ...pack,
    path: `${category.id}/${pack.id}`,
  })));
  const available = packs.filter(pack => !pack.disabled
    && statSync(join(root, section, 'files', pack.path), { throwIfNoEntry: false })?.isDirectory());

  return { catalog, available, total: packs.length };
}

function flattenVanillaPacks(categories: VanillaCategory[]): VanillaPack[] {
  return categories.flatMap(category => [
    ...(category.packs ?? []),
    ...flattenVanillaPacks(category.categories ?? []),
  ]);
}

const aliases: Record<string, Record<string, string>> = JSON.parse(
  await readFile(join(import.meta.dirname, 'aliases.json'), 'utf8'),
);

async function compare({ id, name, kind }: ComparisonSection): Promise<SectionComparison> {
  const url = `https://vanillatweaks.net/assets/resources/json/${vanillaVersion}/${kind}categories.json`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });

  if (!response.ok) { throw new Error(`${url} returned HTTP ${response.status}`); }

  const vanilla: { categories: VanillaCategory[] } = await response.json();
  const packs = flattenVanillaPacks(vanilla.categories);

  if (packs.length === 0 || packs.some(pack => typeof pack.name !== 'string' || !normalize(pack.name))) {
    throw new Error(`Invalid Vanilla Tweaks catalog for ${name}.`);
  }

  const bedrock = await readCatalog(id);
  const availablePaths = new Set(bedrock.available.map(pack => pack.path));
  const byName = new Map<string, Set<string>>();

  for (const pack of bedrock.available) {
    for (const key of [normalize(pack.id), normalize(pack.name ?? '')].filter(Boolean)) {
      const paths = byName.get(key) ?? new Set();

      paths.add(pack.path);
      byName.set(key, paths);
    }
  }

  const missingVanillaTweaksPacks: { id: string; name: string }[] = [];
  const vanillaCandidates = new Set<string>();

  for (const pack of packs) {
    const alias = aliases[id]?.[pack.name];
    const keys = [normalize(pack.name), normalize(pack.display ?? '')];
    const candidates = alias
      ? [alias].filter(path => availablePaths.has(path))
      : [...new Set(keys.flatMap(key => [...(byName.get(key) ?? [])]))];

    if (candidates.length !== 1) {
      missingVanillaTweaksPacks.push({ id: pack.name, name: pack.display ?? pack.name });
    }

    for (const path of candidates) { vanillaCandidates.add(path); }
  }

  const extraBedrockPacks = bedrock.available
    .filter(pack => !vanillaCandidates.has(pack.path))
    .map(pack => ({ path: pack.path, name: pack.name ?? pack.id }));
  const matchedVanillaTweaksCount = packs.length - missingVanillaTweaksPacks.length;

  return {
    id,
    name,
    coverage: {
      vanillaTweaksCatalog: url,
      bedrockCatalogVersion: bedrock.catalog.version.join('.'),
      vanillaTweaksCount: packs.length,
      matchedVanillaTweaksCount,
      coveragePercent: Number((100 * matchedVanillaTweaksCount / packs.length).toFixed(1)),
      bedrockCatalogCount: bedrock.total,
      availableBedrockPacksCount: bedrock.available.length,
      missingVanillaTweaksCount: missingVanillaTweaksPacks.length,
      extraBedrockPacksCount: extraBedrockPacks.length,
      missingVanillaTweaksPacks,
      extraBedrockPacks,
    },
  };
}

function badge(label: string, value: string, color: string): string {
  const content = [label, value, color].map(part => encodeURIComponent(part.replaceAll('_', '__').replaceAll('-', '--'))).join('-');

  return `![${label} ${value}](https://img.shields.io/badge/${content}?style=flat-square)`;
}

const comparisons = await Promise.all(comparisonSections.map(compare));
const coverage = {
  vanillaTweaksVersion: vanillaVersion,
  availableBedrockPacksCount: comparisons.reduce((total, section) => total + section.coverage.availableBedrockPacksCount, 0),
  extraBedrockPacksCount: comparisons.reduce((total, section) => total + section.coverage.extraBedrockPacksCount, 0),
  sections: Object.fromEntries(comparisons.map(section => [section.id, section.coverage])),
};
const badges = [
  ...comparisons.map((section) => {
    const { matchedVanillaTweaksCount, vanillaTweaksCount, coveragePercent, extraBedrockPacksCount } = section.coverage;
    const value = `${matchedVanillaTweaksCount}/${vanillaTweaksCount} VT · ${coveragePercent.toFixed(1)}% · +${extraBedrockPacksCount} Bedrock`;

    return badge(section.name, value, 'blue');
  }),
];

const readmePath = join(root, 'README.md');
const readme = await readFile(readmePath, 'utf8');
const startTag = '<!-- catalog-badges:start -->';
const endTag = '<!-- catalog-badges:end -->';
const start = readme.indexOf(startTag);
const end = readme.indexOf(endTag);

if (start < 0 || end <= start) { throw new Error('README is missing the catalog badge markers.'); }

const eol = readme.includes('\r\n') ? '\r\n' : '\n';
const updatedReadme = readme.slice(0, start + startTag.length)
  + `${eol}${badges.join(eol)}${eol}` + readme.slice(end);
const out = join(root, 'out');

await mkdir(out, { recursive: true });
await writeFile(join(out, 'coverage.json'), `${JSON.stringify(coverage, null, '\t')}\n`);
await writeFile(readmePath, updatedReadme);
console.info(`Updated out/coverage.json and README badges against Vanilla Tweaks ${vanillaVersion}.`);
