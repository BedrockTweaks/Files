import { join } from 'node:path';

import {
	OUT_DIR,
	TOOL_DIR,
	config,
	distance,
	flattenBedrockTweaks,
	flattenVanillaTweaks,
	iconUrl,
	norm,
	pickerUrl,
	readBedrockTweaks,
	readCachedCatalog,
	readJson,
	slug,
	stripHtml,
	writeJson,
	writeText,
} from './lib.mjs';

const aliases = readJson(join(TOOL_DIR, 'aliases.json'));
const ignored = readJson(join(TOOL_DIR, 'ignore.json'));

/**
 * Indexes Bedrock Tweaks packs by every key they can be matched on.
 *
 * @param {any[]} packs - Flattened Bedrock Tweaks packs.
 * @returns {Map<string, any>} Comparison key to pack.
 */
const indexBedrockTweaks = (packs) => {
	const index = new Map();

	for (const pack of packs) {
		index.set(norm(pack.id), pack);
		if (!index.has(norm(pack.name))) index.set(norm(pack.name), pack);
	}

	return index;
};

/**
 * Resolves a Vanilla Tweaks pack to its Bedrock Tweaks counterpart.
 *
 * @param {any} pack - A Vanilla Tweaks pack.
 * @param {Record<string, string>} sectionAliases - Alias overrides for the section.
 * @param {Map<string, any>} index - Bedrock Tweaks lookup index.
 * @returns {{ pack: any, via: string } | null} The match, or `null` when absent.
 */
const resolve = (pack, sectionAliases, index) => {
	const alias = sectionAliases[pack.name] ?? sectionAliases[pack.display];

	if (alias) {
		const aliased = index.get(norm(alias));

		return aliased ? { pack: aliased, via: 'alias' } : null;
	}

	const byName = index.get(norm(pack.name));
	if (byName) return { pack: byName, via: 'name' };

	const byDisplay = index.get(norm(pack.display));
	if (byDisplay) return { pack: byDisplay, via: 'display' };

	return null;
};

/**
 * Finds close Bedrock Tweaks names for an unmatched pack, to speed up alias curation.
 *
 * @param {any} pack - An unmatched Vanilla Tweaks pack.
 * @param {any[]} bedrockPacks - Flattened Bedrock Tweaks packs.
 * @returns {any[]} Ranked suggestions.
 */
const suggest = (pack, bedrockPacks) => {
	const target = norm(pack.display || pack.name);

	return bedrockPacks
		.map((candidate) => ({
			id: candidate.id,
			name: candidate.name,
			category: candidate.category,
			distance: distance(target, norm(candidate.name)),
		}))
		.filter((candidate) => candidate.distance <= config.suggestionMaxDistance)
		.sort((a, b) => a.distance - b.distance)
		.slice(0, 3);
};

/**
 * Diffs one section of the Vanilla Tweaks catalog against Bedrock Tweaks.
 *
 * @param {any} section - A section entry from `config.json`.
 * @returns {any} The section report.
 */
const diffSection = (section) => {
	const catalog = readCachedCatalog(section);
	const document = readBedrockTweaks(section);

	const vanillaPacks = flattenVanillaTweaks(catalog);
	const bedrockPacks = flattenBedrockTweaks(document);
	const index = indexBedrockTweaks(bedrockPacks);

	const sectionAliases = aliases[section.id] ?? {};
	const sectionIgnored = ignored[section.id] ?? {};
	const categoryIds = new Set((document.categories ?? []).map((category) => category.id));

	const missing = [];
	const matched = [];
	const skipped = [];
	const matchedIds = new Set();

	for (const pack of vanillaPacks) {
		const targetCategory = pack.categoryPath.map(slug).join('/');
		const reason = sectionIgnored[pack.name] ?? sectionIgnored[pack.display];

		if (reason) {
			skipped.push({ name: pack.name, display: pack.display, reason });
			continue;
		}

		const match = resolve(pack, sectionAliases, index);

		if (match) {
			matchedIds.add(match.pack.id);
			matched.push({
				vanillaName: pack.name,
				display: pack.display,
				bedrockId: match.pack.id,
				via: match.via,
				vanillaCategory: targetCategory,
				bedrockCategory: match.pack.category,
				categoryDrift: targetCategory !== match.pack.category,
			});
			continue;
		}

		missing.push({
			name: pack.name,
			display: pack.display,
			description: stripHtml(pack.description),
			categoryPath: pack.categoryPath,
			targetCategory,
			targetCategoryExists: categoryIds.has(targetCategory),
			icon: iconUrl(section, pack),
			picker: pickerUrl(section),
			suggestions: suggest(pack, bedrockPacks),
		});
	}

	const bedrockOnly = bedrockPacks
		.filter((pack) => !matchedIds.has(pack.id))
		.map((pack) => ({ id: pack.id, name: pack.name, category: pack.category }));

	return {
		section: section.id,
		bedrockTweaksVersion: (document.version ?? []).join('.'),
		counts: {
			vanillaTweaks: vanillaPacks.length,
			bedrockTweaks: bedrockPacks.length,
			matched: matched.length,
			missing: missing.length,
			bedrockOnly: bedrockOnly.length,
			ignored: skipped.length,
			categoryDrift: matched.filter((entry) => entry.categoryDrift).length,
		},
		missing,
		matched,
		bedrockOnly,
		ignored: skipped,
	};
};

/**
 * Renders the human-readable report.
 *
 * @param {any} report - The full report object.
 * @returns {string} Markdown.
 */
const render = (report) => {
	const lines = [
		'# Vanilla Tweaks parity report',
		'',
		`Vanilla Tweaks version \`${report.vanillaTweaksVersion}\` · generated \`${report.generatedAt}\``,
		'',
		'| Section | VT | BT | Matched | Missing | BT-only | Ignored | Category drift |',
		'| --- | --: | --: | --: | --: | --: | --: | --: |',
	];

	for (const entry of Object.values(report.sections)) {
		const { counts } = entry;

		lines.push(`| \`${entry.section}\` | ${counts.vanillaTweaks} | ${counts.bedrockTweaks} | ${counts.matched} | **${counts.missing}** | ${counts.bedrockOnly} | ${counts.ignored} | ${counts.categoryDrift} |`);
	}

	for (const entry of Object.values(report.sections)) {
		lines.push('', `## ${entry.section} — missing (${entry.missing.length})`, '');

		if (!entry.missing.length) lines.push('_Nothing missing._');

		let currentCategory = null;

		for (const pack of entry.missing) {
			const category = pack.categoryPath.join(' > ');

			if (category !== currentCategory) {
				currentCategory = category;
				lines.push('', `### ${category} → \`${pack.targetCategory}\`${pack.targetCategoryExists ? '' : ' _(category does not exist yet)_'}`, '');
			}

			const hint = pack.suggestions.length
				? ` — near: ${pack.suggestions.map((suggestion) => `\`${suggestion.id}\` (${suggestion.distance})`).join(', ')}`
				: '';

			lines.push(`- **${pack.display}** \`${pack.name}\`${hint}`);
		}

		const drift = entry.matched.filter((match) => match.categoryDrift);

		if (drift.length) {
			lines.push('', `### Category drift (${drift.length})`, '');
			for (const match of drift) lines.push(`- **${match.display}** — VT \`${match.vanillaCategory}\` vs BT \`${match.bedrockCategory}\``);
		}

		if (entry.bedrockOnly.length) {
			lines.push('', `### Bedrock Tweaks originals (${entry.bedrockOnly.length})`, '');
			for (const pack of entry.bedrockOnly) lines.push(`- **${pack.name}** \`${pack.id}\` — \`${pack.category}\``);
		}
	}

	return `${lines.join('\n')}\n`;
};

const only = process.argv.find((argument) => argument.startsWith('--section='))?.split('=')[1];
const sections = config.sections.filter((section) => !only || section.id === only);

const report = {
	generatedAt: new Date().toISOString(),
	vanillaTweaksVersion: config.vanillaTweaks.version,
	sections: Object.fromEntries(sections.map((section) => [section.id, diffSection(section)])),
};

writeJson(join(OUT_DIR, 'report.json'), report);
writeText(join(OUT_DIR, 'report.md'), render(report));

for (const entry of Object.values(report.sections)) {
	const { counts } = entry;

	console.log(`${entry.section.padEnd(16)} VT=${counts.vanillaTweaks} BT=${counts.bedrockTweaks} matched=${counts.matched} missing=${counts.missing} btOnly=${counts.bedrockOnly} ignored=${counts.ignored} drift=${counts.categoryDrift}`);
}

console.log(`\nWrote ${join(OUT_DIR, 'report.json')}\nWrote ${join(OUT_DIR, 'report.md')}`);
