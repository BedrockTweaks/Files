import path from "path";

/** @typedef {import("../../../../filters/File Generations/create_file.js").createFile} CreateFileFunction */

(async () => {
	const runDirectory = process.env.RUN_DIRECTORY;

	if (!runDirectory) {
		throw new Error("❌ This file can only be run by using Regolith");
	}

	const modulePath = path.resolve(process.env.ROOT_DIR, "filters/File Generations/create_file.js");

	/** @type {{ createFile: CreateFileFunction }} */
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
	"format_version": "1.21.50",
	"minecraft:recipe_shapeless": {
		"description": {
			"identifier": "bt:e.${color}_elevator"
		},
		"tags": [
			"crafting_table"
		],
		"group": "elevators",
		"ingredients": [
			{
				"item": "minecraft:${color}_wool"
			},
			{
				"item": "minecraft:ender_pearl"
			}
		],
		"unlock": [
			{
				"item": "minecraft:${color}_wool"
			},
			{
				"item": "minecraft:ender_pearl"
			}
		],
		"result": "bt:e.${color}_elevator",
		"priority": -1
	}
}`,
			`BP/recipes/elevators/e.${color}_elevator.recipe.json`,
			runDirectory
		);
	}
})();
