import path from "path";

(async () => {
	const rootDir = process.env.ROOT_DIR || process.cwd();

	const modulePath = path.resolve(rootDir, "filters/File Generations/create_file.js");
	const { createFile } = await import(`file://${modulePath}`);

	const ElevatorBlockColors = [
		"black",
		"blue",
		"brown",
		"cyan",
		"gray",
		"green",
		"light_blue",
		"light_gray",
		"lime",
		"magenta",
		"orange",
		"pink",
		"purple",
		"red",
		"white",
		"yellow"
	];

	for (const color of ElevatorBlockColors) {
		createFile(
			`{
	"pools": [
		{
			"rolls": 1,
			"entries": [
				{
					"type": "item",
					"name": "minecraft:${color}_wool"
				}
			]
		},
		{
			"rolls": 1,
			"entries": [
				{
					"type": "item",
					"name": "minecraft:ender_pearl"
				}
			]
		}
	]
}`,
			`BP/loot_tables/blocks/e.${color}_elevator.loot.json`,
			rootDir
		);
	}
})();
