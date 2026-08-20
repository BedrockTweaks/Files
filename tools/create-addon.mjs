#!/usr/bin/env node
/**
 * Bedrock Tweaks wrapper around `@bedrock-core/cli`.
 *
 * Scaffolds an addon straight into `addons/files/<category>/<addon_name>/`
 * with the BT conventions applied — no manual renaming or package surgery:
 *
 *   - project is scaffolded as `<category_initials>_<addon_name>` so the
 *     bedrock-core namespace becomes `bt_<category_initials>_<addon_name>`
 *     (creator id `bt` — every addon here belongs to Bedrock Tweaks)
 *   - the author stays YOU: `--author` flag, or your git user.name — it lands
 *     in config.json, the manifests, and the bedrock-core registry UI shows
 *     it as "Bedrock Tweaks, <author>"
 *   - the directory is renamed to just `<addon_name>`
 *   - package.json becomes a private `@bedrock-tweaks/<addon_name>` workspace
 *     package (machine-specific scripts dropped)
 *   - addon-local `yarn.lock` / `.yarnrc.yml` / `.yarn/` are removed
 *     (installs are managed from the repo root)
 *   - the category package.json gains the new workspace entry
 *
 * Usage:
 *   yarn create-addon <category>[/<subcategory>...] <addon_name> [--author <name>] [description...]
 *
 * Example:
 *   yarn create-addon gameplay_changes graves When you die, a grave saves all your drops.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const BRAND = 'Bedrock Tweaks';

const fail = (message) => {
	console.error(`❌ ${message}`);
	process.exit(1);
};

const rawArgs = process.argv.slice(2);
const authorFlag = rawArgs.indexOf('--author');
let authorArg;

if (authorFlag !== -1) {
	authorArg = rawArgs[authorFlag + 1];

	// A bare `--author` used to fall through to the git name AND eat the next
	// argument, silently turning the addon name into the description.
	if (!authorArg || authorArg.startsWith('--')) {
		fail('--author needs a name, e.g. --author "Your Name".');
	}

	rawArgs.splice(authorFlag, 2);
}

const [category, name, ...descriptionWords] = rawArgs;

if (!category || !name) {
	console.error('Usage: yarn create-addon <category>[/<subcategory>...] <addon_name> [--author <name>] [description...]');
	console.error('Example: yarn create-addon gameplay_changes graves When you die, a grave saves all your drops.');
	process.exit(1);
}

const gitName = spawnSync('git', ['config', 'user.name'], { encoding: 'utf8' }).stdout?.trim();
const author = authorArg || gitName || BRAND;

const segments = category.split('/');

for (const segment of segments) {
	if (!NAME_RE.test(segment)) {
		fail(`Invalid category segment '${segment}' — lowercase letters, digits and underscores only.`);
	}
}

if (!NAME_RE.test(name)) {
	fail(`Invalid addon name '${name}' — lowercase letters, digits and underscores only.`);
}

// gameplay_changes -> gc; nested categories join their initials with '_'.
const initials = (segment) => segment.split('_').filter(Boolean).map(word => word[0]).join('');
const prefix = segments.map(initials).join('_');
const projectName = `${prefix}_${name}`;
const categoryDir = path.join(root, 'addons', 'files', ...segments);
const scaffoldDir = path.join(categoryDir, projectName);
const targetDir = path.join(categoryDir, name);
const description = descriptionWords.join(' ') || 'A Bedrock Tweaks addon.';

if (existsSync(targetDir)) {
	fail(`${targetDir} already exists.`);
}

if (existsSync(scaffoldDir)) {
	fail(`${scaffoldDir} already exists.`);
}

mkdirSync(categoryDir, { recursive: true });

// BEDROCK_CORE_CLI may point at a checked-out cli entry (dist/index.js).
// The CLI author must be `bt` — it becomes the creator id half of the addon
// namespace. The real author is patched in below; that split is a BT thing,
// not a bedrock-core one.
const quote = (value) => `"${value.replace(/"/g, '\\"')}"`;
const cliArgs = [projectName, '--author', 'bt', '--description', description];
const command = process.env.BEDROCK_CORE_CLI
	? `node ${quote(process.env.BEDROCK_CORE_CLI)} ${cliArgs.map(quote).join(' ')}`
	: `npx @bedrock-core/cli ${cliArgs.map(quote).join(' ')}`;

console.info(`▶ ${command}`);
const result = spawnSync(command, { cwd: categoryDir, stdio: 'inherit', shell: true });

if (result.status !== 0 || !existsSync(scaffoldDir)) {
	fail('The bedrock-core CLI did not produce a project.');
}

renameSync(scaffoldDir, targetDir);

// Monorepo adaptation — the root workspace owns installs.
for (const file of ['yarn.lock', '.yarnrc.yml', '.yarn']) {
	rmSync(path.join(targetDir, file), { recursive: true, force: true });
}

const packagePath = path.join(targetDir, 'package.json');
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

pkg.name = `@bedrock-tweaks/${name}`;
pkg.private = true;
pkg.scripts ??= {};

delete pkg.scripts.loopback;
delete pkg.scripts['loopback:preview'];

writeFileSync(packagePath, `${JSON.stringify(pkg, null, '\t')}\n`);

// The render pack the CLI downloads is a build artifact, not source.
appendFileSync(path.join(targetDir, '.gitignore'), '\n# Render pack (downloaded by the bedrock-core CLI, not committed)\ncore-ui-*.mcpack\n');

// Authorship: creator id is `bt`, but the credit is the human author.
const configPath = path.join(targetDir, 'config.json');
const regolithConfig = JSON.parse(readFileSync(configPath, 'utf8'));

regolithConfig.author = author;
writeFileSync(configPath, `${JSON.stringify(regolithConfig, null, '\t')}\n`);

// The bedrock-core registry UI shows the creator display name: author + brand.
const i18nPath = path.join(targetDir, 'packs', 'data', 'i18n', 'en_US.ts');

if (existsSync(i18nPath)) {
	const i18nSource = readFileSync(i18nPath, 'utf8');

	writeFileSync(i18nPath, i18nSource.replace("creator: 'bt'", `creator: '${author === BRAND ? BRAND : `${BRAND}, ${author}`}'`));
}

// Pack-list credits: the author of record plus the brand.
for (const pack of ['BP', 'RP']) {
	const manifestPath = path.join(targetDir, 'packs', pack, 'manifest.json');

	if (!existsSync(manifestPath)) {
		continue;
	}

	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	const authors = [...new Set([BRAND, author])];

	manifest.metadata = { ...manifest.metadata, authors };
	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`);
}

// Register the addon in the category workspaces (creating the package if new).
const categoryPackagePath = path.join(categoryDir, 'package.json');
const categoryPkg = existsSync(categoryPackagePath)
	? JSON.parse(readFileSync(categoryPackagePath, 'utf8'))
	: { private: true, workspaces: [] };

categoryPkg.workspaces ??= [];

if (!categoryPkg.workspaces.includes(name)) {
	categoryPkg.workspaces.push(name);
	categoryPkg.workspaces.sort();
}

writeFileSync(categoryPackagePath, `${JSON.stringify(categoryPkg, null, '\t')}\n`);

console.info('');
console.info(`✔ addons/files/${segments.join('/')}/${name} — namespace bt_${projectName}`);
console.info('');
console.info('Next steps:');
console.info('  1. yarn install                (repo root)');
console.info(`  2. cd addons/files/${segments.join('/')}/${name}`);
console.info('  3. yarn run regolith-install && yarn run build');
console.info(`  4. Add the pack to addons/packs.json with id '${name}' under the '${segments.join('/')}' category`);
