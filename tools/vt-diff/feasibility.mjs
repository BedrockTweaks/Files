import { join } from 'node:path';

import { OUT_DIR, TOOL_DIR, config, readJson, writeJson, writeText } from './lib.mjs';

const RESERVED = new Set(['$comment', '$example']);

const settings = config.feasibility;
const store = readJson(join(TOOL_DIR, 'feasibility.json'));

/**
 * Reads the verdict recorded for a pack, if any.
 *
 * @param {string} sectionId - The Bedrock Tweaks section id.
 * @param {string} name - The Vanilla Tweaks pack name.
 * @returns {any | null} The stored entry.
 */
export const verdictFor = (sectionId, name) => (store[sectionId] ?? {})[name] ?? null;

/**
 * Validates every stored entry.
 *
 * @returns {string[]} Human-readable problems, empty when the store is valid.
 */
export const validate = () => {
	const problems = [];

	for (const [sectionId, entries] of Object.entries(store)) {
		if (RESERVED.has(sectionId)) continue;

		if (!config.sections.some((section) => section.id === sectionId)) {
			problems.push(`Unknown section "${sectionId}".`);
			continue;
		}

		for (const [name, entry] of Object.entries(entries)) {
			const where = `${sectionId}/${name}`;

			if (!settings.verdicts.includes(entry.verdict))
				problems.push(`${where}: verdict "${entry.verdict}" is not one of ${settings.verdicts.join(', ')}.`);

			if (!entry.summary?.trim()) problems.push(`${where}: missing summary.`);
			if (!entry.mechanism?.trim()) problems.push(`${where}: missing mechanism.`);
			if (!['high', 'medium', 'low'].includes(entry.confidence)) problems.push(`${where}: confidence must be high, medium or low.`);
			if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.checkedAt ?? '')) problems.push(`${where}: checkedAt must be YYYY-MM-DD.`);

			const sources = entry.sources ?? [];

			if (entry.verdict !== 'unknown' && sources.length < settings.minimumSources)
				problems.push(`${where}: needs at least ${settings.minimumSources} source(s).`);

			for (const source of sources) {
				let host;

				try {
					host = new URL(source).host;
				} catch {
					problems.push(`${where}: "${source}" is not a URL.`);
					continue;
				}

				if (!settings.trustedSourceHosts.some((trusted) => host === trusted || host.endsWith(`.${trusted}`)))
					problems.push(`${where}: host "${host}" is not in trustedSourceHosts.`);
			}
		}
	}

	return problems;
};

/**
 * Lists missing packs that still need a verdict.
 *
 * @returns {any[]} The pending packs.
 */
const collectPending = () => {
	const report = readJson(join(OUT_DIR, 'report.json'));
	const pending = [];

	for (const section of config.sections) {
		const entry = report.sections[section.id];

		if (!entry) continue;

		for (const pack of entry.missing) {
			const existing = verdictFor(section.id, pack.name);

			if (existing && existing.verdict !== 'unknown') continue;

			pending.push({
				section: section.id,
				name: pack.name,
				display: pack.display,
				description: pack.description,
				category: pack.categoryPath.join(' > '),
				targetCategory: pack.targetCategory,
				icon: pack.icon,
			});
		}
	}

	return pending;
};

/**
 * Writes the research worklist and its per-agent batch files.
 */
const main = () => {
	const pending = collectPending();
	const batches = [];

	for (let index = 0; index < pending.length; index += settings.batchSize)
		batches.push(pending.slice(index, index + settings.batchSize));

	batches.forEach((packs, index) => {
		writeJson(join(OUT_DIR, 'feasibility-batches', `batch-${String(index + 1).padStart(2, '0')}.json`), {
			batch: index + 1,
			of: batches.length,
			packs,
		});
	});

	const counts = {};

	for (const [sectionId, entries] of Object.entries(store)) {
		if (RESERVED.has(sectionId)) continue;

		for (const entry of Object.values(entries)) {
			if (!entry?.verdict) continue;

			counts[entry.verdict] = (counts[entry.verdict] ?? 0) + 1;
		}
	}

	const recorded = Object.values(counts).reduce((total, count) => total + count, 0);

	const lines = [
		'# Bedrock feasibility worklist',
		'',
		`${pending.length} missing pack(s) have no verdict yet, split into ${batches.length} batch(es) of up to ${settings.batchSize}.`,
		'',
		`Recorded verdicts: ${Object.entries(counts).map(([verdict, count]) => `\`${verdict}\` ${count}`).join(' · ') || '_none yet_'}`,
		'',
		'Batch files live in `out/feasibility-batches/`. Hand one file to one agent. The research procedure, the source hierarchy and the verdict rubric are in `AGENTS.md`.',
		'',
	];

	for (const [index, packs] of batches.entries()) {
		lines.push(`## Batch ${index + 1}`, '');
		for (const pack of packs) lines.push(`- \`${pack.section}\` **${pack.display}** (\`${pack.name}\`) — ${pack.category} — ${pack.description}`);
		lines.push('');
	}

	writeText(join(OUT_DIR, 'feasibility-todo.md'), `${lines.join('\n')}\n`);

	const problems = validate();

	if (problems.length) {
		console.error(`feasibility.json has ${problems.length} problem(s). Run with --validate for details.`);
		process.exitCode = 1;
	}

	console.log(`pending=${pending.length} batches=${batches.length} recorded=${recorded}`);
	console.log(`Wrote ${join(OUT_DIR, 'feasibility-todo.md')}`);
	console.log(`Wrote ${join(OUT_DIR, 'feasibility-batches')}/batch-NN.json`);
};

if (import.meta.filename === process.argv[1]) {
	if (process.argv.includes('--validate')) {
		const problems = validate();

		for (const problem of problems) console.error(`  ${problem}`);

		console.log(problems.length ? `\n${problems.length} problem(s) in feasibility.json.` : 'feasibility.json is valid.');
		process.exit(problems.length ? 1 : 0);
	}

	main();
}
