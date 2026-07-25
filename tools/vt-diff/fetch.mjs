import { config, cachePath, catalogUrl, writeJson } from './lib.mjs';

/**
 * Downloads every Vanilla Tweaks catalog for the configured version into `.cache/`.
 */
const main = async () => {
	console.log(`Vanilla Tweaks version ${config.vanillaTweaks.version}`);

	for (const section of config.sections) {
		const url = catalogUrl(section);
		const response = await fetch(url);

		if (!response.ok) throw new Error(`${url} responded ${response.status}`);

		const catalog = await response.json();

		writeJson(cachePath(section), catalog);
		console.log(`  ${section.vtKind} -> ${section.id}: ${JSON.stringify(catalog).length} bytes`);
	}
};

await main();
