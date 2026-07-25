import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_DIR = join(TOOL_DIR, '..', '..');
export const CACHE_DIR = join(TOOL_DIR, '.cache');
export const OUT_DIR = join(TOOL_DIR, 'out');

/**
 * Reads and parses a JSON file.
 *
 * @param {string} path - Absolute path to the file.
 * @returns {any} The parsed contents.
 */
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/**
 * Writes a value as tab-indented JSON, creating parent directories as needed.
 *
 * @param {string} path - Absolute path to the file.
 * @param {any} data - The value to serialise.
 */
export const writeJson = (path, data) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(data, null, '\t')}\n`);
};

/**
 * Writes a text file, creating parent directories as needed.
 *
 * @param {string} path - Absolute path to the file.
 * @param {string} text - The contents to write.
 */
export const writeText = (path, text) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text);
};

export const config = readJson(join(TOOL_DIR, 'config.json'));

/**
 * Collapses a pack name into a comparison key: lowercase, alphanumerics only.
 *
 * @param {unknown} value - The name to normalise.
 * @returns {string} The comparison key.
 */
export const norm = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Converts a Vanilla Tweaks display category into a Bedrock Tweaks category id.
 *
 * @param {unknown} value - The display category name.
 * @returns {string} The category id.
 */
export const slug = (value) => String(value ?? '')
	.toLowerCase()
	.replace(/['’]/g, '')
	.replace(/&/g, 'and')
	.replace(/[^a-z0-9+]+/g, '_')
	.replace(/^_+|_+$/g, '');

/**
 * Removes HTML markup from a Vanilla Tweaks description.
 *
 * @param {unknown} value - The raw description.
 * @returns {string} Plain text.
 */
export const stripHtml = (value) => String(value ?? '')
	.replace(/<[^>]*>/g, ' ')
	.replace(/&nbsp;/g, ' ')
	.replace(/\s+/g, ' ')
	.trim();

/**
 * Levenshtein distance between two strings, used only to suggest alias candidates.
 *
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} The edit distance.
 */
export const distance = (a, b) => {
	if (a === b) return 0;
	if (!a.length || !b.length) return Math.max(a.length, b.length);

	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

	for (let i = 1; i <= a.length; i++) {
		const current = [i];

		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
		}

		previous = current;
	}

	return previous[b.length];
};

/**
 * Flattens a Vanilla Tweaks catalog into a list of packs carrying their category trail.
 *
 * @param {any} catalog - A parsed `{kind}categories.json` document.
 * @returns {any[]} The flattened packs.
 */
export const flattenVanillaTweaks = (catalog) => {
	const packs = [];

	const walk = (node, trail) => {
		const categoryPath = [...trail, node.category];

		for (const pack of node.packs ?? []) packs.push({ ...pack, categoryPath });
		for (const child of node.categories ?? []) walk(child, categoryPath);
	};

	for (const node of catalog.categories ?? []) walk(node, []);

	return packs;
};

/**
 * Flattens a Bedrock Tweaks `packs.json` into a list of packs carrying their category id.
 *
 * @param {any} document - A parsed `packs.json` document.
 * @returns {any[]} The flattened packs.
 */
export const flattenBedrockTweaks = (document) => {
	const packs = [];

	for (const category of document.categories ?? [])
		for (const pack of category.packs ?? []) packs.push({ ...pack, category: category.id });

	return packs;
};

/**
 * Builds the Vanilla Tweaks catalog URL for a section.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {string} The catalog URL.
 */
export const catalogUrl = (section) => config.vanillaTweaks.catalogUrl
	.replace('{version}', config.vanillaTweaks.version)
	.replace('{kind}', section.vtKind);

/**
 * Builds the Vanilla Tweaks icon URL for a pack.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} pack - A Vanilla Tweaks pack.
 * @returns {string} The icon URL.
 */
export const iconUrl = (section, pack) => config.vanillaTweaks.iconUrl
	.replace('{iconDir}', section.vtIconDir)
	.replace('{version}', config.vanillaTweaks.version)
	.replace('{name}', encodeURIComponent(pack.name));

/**
 * Builds the Vanilla Tweaks picker URL for a section.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {string} The picker URL.
 */
export const pickerUrl = (section) => config.vanillaTweaks.pickerUrl.replace('{picker}', section.vtPicker);

/**
 * Path to a cached Vanilla Tweaks catalog for the configured version.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {string} The cache file path.
 */
export const cachePath = (section) => join(CACHE_DIR, `${config.vanillaTweaks.version}-${section.vtKind}.json`);

/**
 * Loads a cached catalog, failing with a clear message when `fetch.mjs` has not run.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {any} The parsed catalog.
 */
export const readCachedCatalog = (section) => {
	const path = cachePath(section);

	if (!existsSync(path)) throw new Error(`Missing cache for "${section.id}". Run: node tools/vt-diff/fetch.mjs`);

	return readJson(path);
};

/**
 * Loads a Bedrock Tweaks `packs.json` for a section.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {any} The parsed document.
 */
export const readBedrockTweaks = (section) => readJson(join(REPO_DIR, section.id, 'packs.json'));
