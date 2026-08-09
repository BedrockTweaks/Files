import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
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
 * Reports whether a gh failure is GitHub refusing the write rather than the call being malformed.
 *
 * Retrying a malformed call as a comment would post nonsense, so only genuine permission and
 * lock failures fall back.
 *
 * @param {any} error - The error thrown by `run`.
 * @returns {boolean} True when the write was refused.
 */
const isPermissionFailure = (error) => /403|404|not authorized|must have admin|permission|read-only|locked|HTTP 401/i
	.test(`${error?.stderr ?? ''}${error?.stdout ?? ''}${error?.message ?? ''}`);

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

		if (response.status === 403 || response.status === 429) {
			const reset = Number(response.headers.get('x-ratelimit-reset'));
			const minutes = reset ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000)) : null;

			throw new Error([
				'GitHub rejected the request: the unauthenticated API allows only 60 requests an hour.',
				minutes ? `The limit resets in about ${minutes} minute(s).` : null,
				'Run `gh auth login` to lift it — authenticated runs get 5000 an hour and never hit this.',
			].filter(Boolean).join('\n  '));
		}

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
 * Builds the marker for a grouped colour-variant family.
 *
 * Groups carry one marker for the whole family rather than one per member, so the regex in the
 * issue scan resolves a group issue to its group id and never to a member pack.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} group - A group entry from `config.issues.groups`.
 * @returns {string} The marker comment.
 */
const groupMarker = (section, group) => `<!-- vt-diff:id=${section.vtKind}/group:${group.id} -->`;

/**
 * Resolves the group a pack belongs to, if any.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} pack - A missing Vanilla Tweaks pack.
 * @returns {any | undefined} The matching group entry.
 */
const groupFor = (section, pack) => (config.issues.groups ?? []).find(
	(group) => group.section === section.id && group.category === pack.targetCategory,
);

/**
 * Renders the managed block for a grouped family: one checklist plus one shared verdict.
 *
 * Shipped members are ticked, so the issue doubles as a progress tracker for the family.
 *
 * @param {any} section - A section entry from `config.json`.
 * @param {any} group - A group entry from `config.issues.groups`.
 * @param {any[]} missing - Member packs still absent from packs.json.
 * @param {any[]} shipped - Member packs already matched.
 * @returns {string} The block, including its markers.
 */
const renderGroupBlock = (section, group, missing, shipped) => {
	const sample = missing[0];
	const verdict = verdictFor(section.id, sample.name);
	const verdicts = [...new Set(missing.map((pack) => verdictFor(section.id, pack.name)?.verdict ?? 'unknown'))];

	const lines = [
		config.issues.markerStart,
		'### Vanilla Tweaks reference',
		'',
		'| | |',
		'| --- | --- |',
		`| Family | **${missing.length + shipped.length} packs** in one issue |`,
		`| Section | ${section.name} |`,
		`| Vanilla Tweaks category | ${sample.categoryPath.join(' > ')} |`,
		`| Bedrock Tweaks category | \`${sample.targetCategory}\`${sample.targetCategoryExists ? '' : ' — **does not exist yet**'} |`,
		`| Picker | ${sample.picker} |`,
		`| Version | \`${config.vanillaTweaks.version}\` |`,
		'',
		`> ${group.note}`,
		'',
		`### Packs (${shipped.length}/${missing.length + shipped.length} shipped)`,
		'',
	];

	for (const pack of shipped) lines.push(`- [x] **${pack.display}** — shipped as \`${pack.bedrockId}\``);
	for (const pack of missing) lines.push(`- [ ] **${pack.display}** (\`${pack.name}\`)`);

	lines.push('', `<img src="${sample.icon}" width="96" alt="${sample.display}">`);

	if (verdicts.length > 1)
		lines.push('', `> [!WARNING]`, `> Members of this group do not share one verdict (\`${verdicts.join('`, `')}\`). Consider splitting it in \`config.json\`.`);

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
			'_The whole family shares one implementation, so one verdict covers every colour._',
			'',
			// Recorded summaries are written per pack and name their own colour, which reads wrong on a
			// family issue. `groupSummary` lets the family speak for itself without editing the research.
			group.groupSummary ?? verdict.summary,
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
		groupMarker(section, group),
		config.issues.markerEnd,
	);

	return lines.join('\n');
};

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
	// Non-greedy, not `[^ ]+`: addons and crafting_tweaks pack names contain spaces, and a
	// space-excluding class fails to match the marker at all rather than truncating it.
	const marker = /<!-- vt-diff:id=(.*?) -->/.exec(issue.body ?? '');

	if (marker) byMarker.set(marker[1].trim(), issue);

	const key = norm(parseTitle(issue.title).name);

	if (!byName.has(key)) byName.set(key, []);
	byName.get(key).push(issue);
};

const plan = { create: [], update: [], close: [], skipped: [], reopenCandidates: [], rejected: [], upToDate: [], groupConflicts: [] };

for (const section of config.sections) {
	const entry = report.sections[section.id];

	if (!entry) continue;

	const groups = (config.issues.groups ?? []).filter((group) => group.section === section.id);
	const grouped = new Set();

	for (const group of groups) {
		const missing = entry.missing.filter((pack) => pack.targetCategory === group.category);

		if (!missing.length) continue;

		const shipped = entry.matched.filter((match) => match.vanillaCategory === group.category);
		const marker = `${section.vtKind}/group:${group.id}`;
		// `group.issue` adopts an issue that already tracks the family by hand. It only matters on the
		// first run: once the block lands, the marker resolves it like any other managed issue.
		const issue = byMarker.get(marker) ?? (group.issue ? issues.find((candidate) => candidate.number === group.issue) : undefined);
		const block = renderGroupBlock(section, group, missing, shipped);
		const packs = missing.map((pack) => pack.name);
		const verdict = verdictFor(section.id, missing[0].name)?.verdict ?? 'unknown';
		const labels = [...new Set(missing.flatMap((pack) => labelsFor(section, pack)))];

		// A member with its own pre-existing issue would be tracked twice. Report it instead of
		// silently opening a duplicate — the maintainer decides whether to fold it in or ungroup.
		for (const pack of missing) {
			const own = (byName.get(norm(pack.display)) ?? byName.get(norm(pack.name)) ?? [])
				.filter((candidate) => candidate.state === 'OPEN' && candidate.number !== issue?.number);

			for (const candidate of own)
				plan.groupConflicts.push({
					section: section.id,
					group: group.id,
					pack: pack.name,
					display: pack.display,
					number: candidate.number,
					title: candidate.title,
					url: candidate.url,
				});
		}

		for (const pack of missing) grouped.add(pack.name);

		if (!issue) {
			plan.create.push({ section: section.id, group: group.id, pack: group.id, packs, title: group.title, labels, verdict, body: block });
			continue;
		}

		if (issue.state !== 'OPEN') {
			plan.reopenCandidates.push({
				section: section.id,
				group: group.id,
				pack: group.id,
				display: group.title,
				number: issue.number,
				title: issue.title,
				url: issue.url,
				stateReason: issue.stateReason ?? null,
			});
			continue;
		}

		const body = applyBlock(issue.body ?? '', block);
		const addLabels = labels.filter((label) => !issue.labels.map((entry) => entry.name).includes(label));
		const bodyChanged = body.trim() !== (issue.body ?? '').trim();

		if (!bodyChanged && !addLabels.length) plan.upToDate.push({ number: issue.number, title: issue.title });
		else plan.update.push({ section: section.id, group: group.id, pack: group.id, packs, number: issue.number, title: issue.title, url: issue.url, verdict, addLabels, bodyChanged, body });
	}

	// A group whose members have all shipped leaves nothing in `missing`, so it is handled here
	// rather than in the loop above: close it once, when the last member lands.
	for (const group of groups) {
		if (entry.missing.some((pack) => pack.targetCategory === group.category)) continue;

		const issue = byMarker.get(`${section.vtKind}/group:${group.id}`);

		if (!issue || issue.state !== 'OPEN') continue;
		if (!entry.matched.some((match) => match.vanillaCategory === group.category)) continue;

		plan.close.push({ section: section.id, group: group.id, number: issue.number, title: issue.title, url: issue.url, labels: issue.labels.map((label) => label.name) });
	}

	for (const pack of entry.missing) {
		if (grouped.has(pack.name)) continue;

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
				packs: [pack.name],
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
				packs: [pack.name],
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

		// Group issues close only when every member has shipped, which is decided above.
		if (/<!-- vt-diff:id=[^ ]*\/group:/.test(issue.body ?? '')) continue;
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

// Counted in packs, not issues: one grouped issue covers many packs, and reporting it as a single
// unit would overstate coverage.
const plannedPacks = planned.flatMap((item) => (item.packs ?? [item.pack]).map((pack) => ({ section: item.section, pack })));
const researched = plannedPacks.filter(({ section, pack }) => {
	const verdict = verdictFor(section, pack)?.verdict;

	return verdict && verdict !== 'unknown';
}).length;
const unresearched = plannedPacks.length - researched;
const groupedIssues = planned.filter((item) => item.group).length;

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
	`${plannedPacks.length} packs are covered by ${planned.length} issues${groupedIssues ? `, because ${groupedIssues} colour-variant ${groupedIssues === 1 ? 'family is' : 'families are'} grouped into one issue each` : ''}.`,
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

if (plan.groupConflicts.length) {
	lines.push('', '## Grouped packs that already have their own issue', '', 'These would be tracked twice. Either fold the existing issue into the group and close it, or remove the group from `config.json`.', '');
	for (const item of plan.groupConflicts)
		lines.push(`- **${item.display}** (\`${item.pack}\`) is in group \`${item.group}\` but also has #${item.number} ${item.title} — ${item.url}`);
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
	for (const item of plan.create) lines.push(`- \`${item.section}\` **${item.title}** — labels: ${item.labels.join(', ')} — verdict \`${item.verdict}\`${item.group ? ` — grouped, covers ${item.packs.length} packs` : ''}`);
}

if (plan.skipped.length) {
	lines.push('', '## Skipped by feasibility verdict', '');
	for (const item of plan.skipped) lines.push(`- **${item.display}** (\`${item.pack}\`) — verdict \`${item.verdict}\``);
}

writeJson(join(OUT_DIR, 'issue-plan.json'), plan);
writeText(join(OUT_DIR, 'issue-plan.md'), `${lines.join('\n')}\n`);

// Written on the dry run too, so every body can be read as Markdown before anything is sent.
// Cleared first: a pack that has since been ignored or folded into a group would otherwise leave a
// stale file behind, and the directory is what a human reviews before approving the plan.
rmSync(join(OUT_DIR, 'bodies'), { recursive: true, force: true });

for (const item of plan.create) writeText(join(OUT_DIR, 'bodies', `create-${item.section}-${norm(item.pack)}.md`), item.body);
for (const item of plan.update) writeText(join(OUT_DIR, 'bodies', `update-${item.number}.md`), item.body);

console.log(`\ncreate=${plan.create.length} update=${plan.update.length} close=${plan.close.length} skipped=${plan.skipped.length} reopenCandidates=${plan.reopenCandidates.length} rejected=${plan.rejected.length} upToDate=${plan.upToDate.length}${plan.groupConflicts.length ? ` groupConflicts=${plan.groupConflicts.length}` : ''}`);
console.log(`feasibility: ${researched} researched, ${unresearched} still unknown (${plannedPacks.length} packs across ${planned.length} issues, ${groupedIssues} grouped)`);
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

const failures = [];
const commented = [];

for (const item of plan.update) {
	const path = join(OUT_DIR, 'bodies', `update-${item.number}.md`);
	const args = ['issue', 'edit', String(item.number), '--repo', config.repository];

	if (item.bodyChanged) {
		writeText(path, item.body);
		args.push('--body-file', path);
	}

	for (const label of item.addLabels) args.push('--add-label', label);

	try {
		run(args);
		console.log(`  updated #${item.number}${item.addLabels.length ? ` (+${item.addLabels.join(' +')})` : ''}`);
	} catch (error) {
		if (!isPermissionFailure(error)) {
			failures.push({ what: `update #${item.number}`, reason: (error.stderr ?? error.message ?? '').trim() });
			console.log(`  FAILED #${item.number} — ${(error.stderr ?? error.message ?? '').trim().split('\n')[0]}`);
			continue;
		}

		// No write access to the body. Post the block as a comment instead, so the reference still
		// reaches the issue without touching anything somebody else wrote.
		const commentPath = join(OUT_DIR, 'bodies', `comment-${item.number}.md`);

		writeText(commentPath, `${item.body}\n\n<sub>Posted as a comment because \`tools/vt-diff\` could not edit this issue.</sub>`);

		try {
			run(['issue', 'comment', String(item.number), '--repo', config.repository, '--body-file', commentPath]);
			commented.push({ number: item.number, title: item.title });
			console.log(`  commented on #${item.number} (no edit permission)`);
		} catch (commentError) {
			failures.push({ what: `update #${item.number}`, reason: `edit and comment both refused: ${(commentError.stderr ?? commentError.message ?? '').trim()}` });
			console.log(`  FAILED #${item.number} — edit and comment both refused`);
		}
	}
}

for (const item of plan.create) {
	const path = join(OUT_DIR, 'bodies', `create-${item.section}-${norm(item.pack)}.md`);

	writeText(path, item.body);

	const args = ['issue', 'create', '--repo', config.repository, '--title', item.title, '--body-file', path];

	for (const label of item.labels) args.push('--label', label);

	try {
		console.log(`  created ${run(args).trim()}`);
	} catch (error) {
		failures.push({ what: `create "${item.title}"`, reason: (error.stderr ?? error.message ?? '').trim() });
		console.log(`  FAILED to create "${item.title}" — ${(error.stderr ?? error.message ?? '').trim().split('\n')[0]}`);
	}
}

for (const item of plan.close) {
	try {
		run(['issue', 'close', String(item.number), '--repo', config.repository, '--comment', 'This pack is now available on Bedrock Tweaks. Closed automatically by `tools/vt-diff`.']);
		console.log(`  closed #${item.number}`);
	} catch (error) {
		failures.push({ what: `close #${item.number}`, reason: (error.stderr ?? error.message ?? '').trim() });
		console.log(`  FAILED to close #${item.number} — ${(error.stderr ?? error.message ?? '').trim().split('\n')[0]}`);
	}
}

if (commented.length) {
	console.log(`\n${commented.length} issue(s) received a comment instead of a body edit:`);
	for (const item of commented) console.log(`  #${item.number} ${item.title}`);
}

if (failures.length) {
	console.log(`\n${failures.length} operation(s) failed:`);
	for (const failure of failures) console.log(`  ${failure.what} — ${failure.reason.split('\n')[0]}`);
	console.log('\nRe-running is safe: the managed marker makes every operation idempotent.');
	process.exitCode = 1;
}

console.log('\nDone.');
