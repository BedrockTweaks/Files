import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { OUT_DIR, TOOL_DIR, config, norm, readJson, writeJson, writeText } from './lib.mjs';
import { verdictFor } from './feasibility.mjs';

const GH_CANDIDATES = [
	process.env.GH_BIN,
	'gh',
	'C:/Program Files/GitHub CLI/gh.exe',
	`${process.env.LOCALAPPDATA}/Programs/GitHub CLI/gh.exe`,
].filter(Boolean);

/**
 * Locates a usable `gh` executable.
 *
 * @returns {string | null} The command or absolute path, or `null` when unavailable.
 */
const resolveGh = () => {
	for (const candidate of GH_CANDIDATES) {
		try {
			if (candidate.includes('/') && !existsSync(candidate)) continue;

			execFileSync(candidate, ['--version'], { stdio: 'ignore' });

			return candidate;
		} catch {
			continue;
		}
	}

	return null;
};

const gh = resolveGh();
const apply = process.argv.includes('--apply');

/**
 * Reports whether gh is installed and authenticated.
 *
 * @returns {boolean} True when gh can be used.
 */
const ghReady = () => {
	if (!gh) return false;

	try {
		execFileSync(gh, ['auth', 'status'], { stdio: 'ignore' });

		return true;
	} catch {
		return false;
	}
};

const authenticated = ghReady();

if (apply && !authenticated)
	throw new Error(gh
		? 'gh is installed but not authenticated. Run: gh auth login'
		: 'gh CLI not found. Install it, then run: gh auth login');

/**
 * Runs a gh command and returns stdout.
 *
 * @param {string[]} args - Arguments passed to gh.
 * @returns {string} Standard output.
 */
const run = (args) => execFileSync(gh, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/**
 * Reads every issue, preferring gh and falling back to the public REST API for dry runs.
 *
 * @returns {Promise<any[]>} The issues.
 */
const loadIssues = async () => {
	if (authenticated) return JSON.parse(run([
		'issue', 'list',
		'--repo', config.repository,
		'--state', 'all',
		'--limit', '2000',
		'--json', 'number,title,body,state,stateReason,labels,url',
	]));

	console.log('  gh unavailable or unauthenticated — falling back to the public REST API (read only).');

	const collected = [];

	for (let page = 1; page <= 20; page++) {
		const url = `https://api.github.com/repos/${config.repository}/issues?state=all&per_page=100&page=${page}`;
		const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });

		if (!response.ok) throw new Error(`${url} responded ${response.status}`);

		const batch = await response.json();

		collected.push(...batch.filter((issue) => !issue.pull_request));

		if (batch.length < 100) break;
	}

	return collected.map((issue) => ({
		number: issue.number,
		title: issue.title,
		body: issue.body ?? '',
		state: issue.state.toUpperCase(),
		stateReason: issue.state_reason ?? null,
		labels: issue.labels.map((label) => ({ name: label.name })),
		url: issue.html_url,
	}));
};

/**
 * Splits an issue title into its bracketed prefix and pack name.
 *
 * @param {string} title - The issue title.
 * @returns {{ prefix: string, name: string }} The parsed parts.
 */
const parseTitle = (title) => {
	const match = /^\s*\[([^\]]+)\]\s*(.+?)\s*$/.exec(title ?? '');

	return match ? { prefix: match[1].trim(), name: match[2].trim() } : { prefix: '', name: (title ?? '').trim() };
};

/**
 * Builds the machine-readable marker embedded in every managed issue body.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} pack - A missing Vanilla Tweaks pack.
 * @returns {string} The marker comment.
 */
const packMarker = (section, pack) => `<!-- vt-diff:id=${section.vtKind}/${pack.name} -->`;

/**
 * Renders the managed block appended to (or refreshed inside) an issue body.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} pack - A missing Vanilla Tweaks pack.
 * @returns {string} The block, including its markers.
 */
const renderBlock = (section, pack) => {
	const verdict = verdictFor(section.id, pack.name);

	const lines = [
		config.issues.markerStart,
		'### Vanilla Tweaks reference',
		'',
		'| | |',
		'| --- | --- |',
		`| Pack | **${pack.display}** (\`${pack.name}\`) |`,
		`| Section | ${section.name} |`,
		`| Vanilla Tweaks category | ${pack.categoryPath.join(' > ')} |`,
		`| Bedrock Tweaks category | \`${pack.targetCategory}\`${pack.targetCategoryExists ? '' : ' — **does not exist yet**'} |`,
		`| Picker | ${pack.picker} |`,
		`| Version | \`${config.vanillaTweaks.version}\` |`,
		'',
		`> ${pack.description || '_No description._'}`,
		'',
		`<img src="${pack.icon}" width="96" alt="${pack.display}">`,
	];

	if (verdict) {
		lines.push(
			'',
			'### Bedrock feasibility',
			'',
			'| | |',
			'| --- | --- |',
			`| Verdict | **${verdict.verdict}** (${verdict.confidence} confidence) |`,
			`| Checked | ${verdict.checkedAt} by ${verdict.checkedBy} |`,
			'',
			verdict.summary,
			'',
			`**How it would work on Bedrock.** ${verdict.mechanism}`,
		);

		if (verdict.caveats) lines.push('', `**Caveats.** ${verdict.caveats}`);

		lines.push('', '<details><summary>Sources</summary>', '');
		for (const source of verdict.sources ?? []) lines.push(`- ${source}`);
		lines.push('', '</details>');
	} else {
		lines.push('', '### Bedrock feasibility', '', '_Not researched yet._');
	}

	lines.push(
		'',
		'<sub>Maintained by `tools/vt-diff`. Edits inside this block are overwritten on the next run.</sub>',
		packMarker(section, pack),
		config.issues.markerEnd,
	);

	return lines.join('\n');
};

/**
 * Resolves the labels an issue should carry for a pack, based on its feasibility verdict.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} pack - A missing Vanilla Tweaks pack.
 * @returns {string[]} The label names.
 */
const labelsFor = (section, pack) => {
	const verdict = verdictFor(section.id, pack.name)?.verdict ?? 'unknown';
	const fromVerdict = config.feasibility.verdictLabels[verdict] ?? config.issues.createLabels;

	return [...new Set([...fromVerdict, section.label])];
};

/**
 * Replaces the managed block in a body, or appends it when absent.
 *
 * @param {string} body - The existing issue body.
 * @param {string} block - The rendered block.
 * @returns {string} The updated body.
 */
const applyBlock = (body, block) => {
	const start = body.indexOf(config.issues.markerStart);
	const end = body.indexOf(config.issues.markerEnd);

	if (start !== -1 && end !== -1 && end > start)
		return `${body.slice(0, start)}${block}${body.slice(end + config.issues.markerEnd.length)}`.trim();

	return `${body.trim()}\n\n${block}`.trim();
};

const report = readJson(join(OUT_DIR, 'report.json'));

console.log(`Fetching issues from ${config.repository} ...`);

const issues = await loadIssues();

console.log(`  ${issues.length} issues (${issues.filter((issue) => issue.state === 'OPEN').length} open)`);

const byMarker = new Map();
const byName = new Map();

for (const issue of issues) {
	const marker = /<!-- vt-diff:id=([^ ]+) -->/.exec(issue.body ?? '');

	if (marker) byMarker.set(marker[1], issue);

	const key = norm(parseTitle(issue.title).name);

	if (!byName.has(key)) byName.set(key, []);
	byName.get(key).push(issue);
};

const plan = { create: [], update: [], close: [], skipped: [], reopenCandidates: [], rejected: [], upToDate: [] };

for (const section of config.sections) {
	const entry = report.sections[section.id];

	if (!entry) continue;

	for (const pack of entry.missing) {
		const marker = `${section.vtKind}/${pack.name}`;
		const candidates = byMarker.has(marker)
			? [byMarker.get(marker)]
			: (byName.get(norm(pack.display)) ?? byName.get(norm(pack.name)) ?? []);

		const open = candidates.filter((issue) => issue.state === 'OPEN');
		const block = renderBlock(section, pack);

		const verdict = verdictFor(section.id, pack.name)?.verdict ?? 'unknown';

		if (!candidates.length) {
			if (config.feasibility.skipCreateVerdicts.includes(verdict)) {
				plan.skipped.push({ section: section.id, pack: pack.name, display: pack.display, verdict });
				continue;
			}

			plan.create.push({
				section: section.id,
				pack: pack.name,
				title: `[${pack.categoryPath.join(' > ')}] ${pack.display}`,
				labels: labelsFor(section, pack),
				verdict,
				body: block,
			});
			continue;
		}

		if (!open.length) {
			const entryFor = (issue) => ({
				section: section.id,
				pack: pack.name,
				display: pack.display,
				number: issue.number,
				title: issue.title,
				url: issue.url,
				stateReason: issue.stateReason ?? null,
			});

			for (const issue of candidates)
				// Closed as "not planned" is a deliberate rejection; closed as completed while the pack is still
				// absent from packs.json means either an alias is missing or the port silently regressed.
				(issue.stateReason === 'not_planned' ? plan.rejected : plan.reopenCandidates).push(entryFor(issue));

			continue;
		}

		for (const issue of open) {
			const body = applyBlock(issue.body ?? '', block);
			const existing = issue.labels.map((label) => label.name);
			const addLabels = labelsFor(section, pack).filter((label) => !existing.includes(label));
			const bodyChanged = body.trim() !== (issue.body ?? '').trim();

			if (!bodyChanged && !addLabels.length) {
				plan.upToDate.push({ number: issue.number, title: issue.title });
				continue;
			}

			plan.update.push({
				section: section.id,
				pack: pack.name,
				number: issue.number,
				title: issue.title,
				url: issue.url,
				verdict,
				addLabels,
				bodyChanged,
				body,
			});
		}
	}

	const shipped = new Set(entry.matched.map((match) => norm(match.display)));

	for (const issue of issues) {
		if (issue.state !== 'OPEN') continue;

		const { prefix, name } = parseTitle(issue.title);

		const labels = issue.labels.map((label) => label.name);

		if (config.issues.nonPackTitlePrefixes.includes(prefix.toLowerCase())) continue;
		if (!labels.includes(section.label)) continue;
		if (!config.issues.closeRequiresLabels.every((label) => labels.includes(label))) continue;
		if (config.issues.closeExcludesLabels.some((label) => labels.includes(label))) continue;
		if (!shipped.has(norm(name))) continue;
		if (plan.close.some((candidate) => candidate.number === issue.number)) continue;

		plan.close.push({ section: section.id, number: issue.number, title: issue.title, url: issue.url, labels });
	}
}

const planned = [...plan.create, ...plan.update];
const researched = planned.filter((item) => item.verdict && item.verdict !== 'unknown').length;
const unresearched = planned.length - researched;

const lines = [
	'# Vanilla Tweaks issue plan',
	'',
	`Repository \`${config.repository}\` · Vanilla Tweaks \`${config.vanillaTweaks.version}\` · report generated \`${report.generatedAt}\``,
	'',
	`- **Create**: ${plan.create.length}`,
	`- **Update** (add or refresh reference block): ${plan.update.length}`,
	`- **Close** (pack now shipped): ${plan.close.length}`,
	`- **Closed as completed but still missing** (alias gap or regression): ${plan.reopenCandidates.length}`,
	`- **Closed as not planned** (candidates for \`ignore.json\`): ${plan.rejected.length}`,
	`- Skipped by feasibility verdict: ${plan.skipped.length}`,
	`- Already up to date: ${plan.upToDate.length}`,
	'',
	`Feasibility coverage: ${researched} of ${researched + unresearched} planned packs have a verdict.${unresearched ? ` Run \`node tools/vt-diff/feasibility.mjs\` and complete the research pass before applying.` : ''}`,
	'',
	'Only **Create**, **Update** and **Close** are executed by `--apply`. The two closed-issue buckets are reports for a human.',
	'',
	'Run `node tools/vt-diff/issues.mjs --apply` to execute.',
];

if (plan.close.length) {
	lines.push('', '## Close — pack now exists in packs.json', '');
	for (const item of plan.close) lines.push(`- #${item.number} ${item.title} — ${item.url}`);
}

if (plan.reopenCandidates.length) {
	lines.push('', '## Closed as completed, yet still missing from packs.json', '', 'Either `aliases.json` needs an entry, or the pack was never actually shipped.', '');
	for (const item of plan.reopenCandidates)
		lines.push(`- **${item.display}** (\`${item.pack}\`) → #${item.number} ${item.title} — ${item.url}`);
}

if (plan.rejected.length) {
	lines.push('', '## Closed as not planned', '', 'Add these to `ignore.json` with a reason so they stop appearing as missing.', '');
	for (const item of plan.rejected)
		lines.push(`- **${item.display}** (\`${item.pack}\`) → #${item.number} — ${item.url}`);
}

if (plan.update.length) {
	lines.push('', '## Update', '');
	for (const item of plan.update) {
		const changes = [item.bodyChanged ? 'body' : null, item.addLabels.length ? `labels +${item.addLabels.join(' +')}` : null].filter(Boolean);

		lines.push(`- #${item.number} ${item.title} — ${changes.join(', ')} — verdict \`${item.verdict}\``);
	}
}

if (plan.create.length) {
	lines.push('', '## Create', '');
	for (const item of plan.create) lines.push(`- \`${item.section}\` **${item.title}** — labels: ${item.labels.join(', ')} — verdict \`${item.verdict}\``);
}

if (plan.skipped.length) {
	lines.push('', '## Skipped by feasibility verdict', '');
	for (const item of plan.skipped) lines.push(`- **${item.display}** (\`${item.pack}\`) — verdict \`${item.verdict}\``);
}

writeJson(join(OUT_DIR, 'issue-plan.json'), plan);
writeText(join(OUT_DIR, 'issue-plan.md'), `${lines.join('\n')}\n`);

console.log(`\ncreate=${plan.create.length} update=${plan.update.length} close=${plan.close.length} skipped=${plan.skipped.length} reopenCandidates=${plan.reopenCandidates.length} rejected=${plan.rejected.length} upToDate=${plan.upToDate.length}`);
console.log(`feasibility: ${researched} researched, ${unresearched} still unknown`);
console.log(`Wrote ${join(OUT_DIR, 'issue-plan.json')}\nWrote ${join(OUT_DIR, 'issue-plan.md')}`);

if (process.argv.includes('--seed-ignore')) {
	const path = join(TOOL_DIR, 'ignore.json');
	const current = readJson(path);
	let added = 0;

	for (const item of plan.rejected) {
		const bucket = current[item.section] ??= {};

		if (bucket[item.pack]) continue;

		bucket[item.pack] = `Closed as not planned in ${config.repository}#${item.number}`;
		added++;
	}

	writeJson(path, current);
	console.log(`\nSeeded ${added} entries into ignore.json. Review the reasons, then re-run diff.mjs.`);
}

if (!apply) {
	console.log('\nDry run. Nothing was sent to GitHub. Re-run with --apply to execute.');
	process.exit(0);
}

console.log('\nApplying ...');

for (const item of plan.update) {
	const path = join(OUT_DIR, 'bodies', `update-${item.number}.md`);
	const args = ['issue', 'edit', String(item.number), '--repo', config.repository];

	if (item.bodyChanged) {
		writeText(path, item.body);
		args.push('--body-file', path);
	}

	for (const label of item.addLabels) args.push('--add-label', label);

	run(args);
	console.log(`  updated #${item.number}${item.addLabels.length ? ` (+${item.addLabels.join(' +')})` : ''}`);
}

for (const item of plan.create) {
	const path = join(OUT_DIR, 'bodies', `create-${item.section}-${norm(item.pack)}.md`);

	writeText(path, item.body);

	const args = ['issue', 'create', '--repo', config.repository, '--title', item.title, '--body-file', path];

	for (const label of item.labels) args.push('--label', label);

	console.log(`  created ${run(args).trim()}`);
}

for (const item of plan.close) {
	run(['issue', 'close', String(item.number), '--repo', config.repository, '--comment', 'This pack is now available on Bedrock Tweaks. Closed automatically by `tools/vt-diff`.']);
	console.log(`  closed #${item.number}`);
}

console.log('\nDone.');
