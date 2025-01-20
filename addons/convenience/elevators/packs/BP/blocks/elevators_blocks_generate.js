import path from "path";

(async () => {
	const rootDir = process.env.ROOT_DIR;

	if (!rootDir) {
		throw new Error("❌ This file can only be run by using Regolith");
	}

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

	const ElevatorBlockMapColorMapping = {
		black: "#191919",
		blue: "#334CB2",
		brown: "#664C33",
		cyan: "#4C7F99",
		gray: "#4C4C4C",
		green: "#667F33",
		light_blue: "#6699D8",
		light_gray: "#999999",
		lime: "#7FCC19",
		magenta: "#B24CD8",
		orange: "#D87F33",
		pink: "#F27FA5",
		purple: "#7F3FB2",
		red: "#993333",
		white: "#FFFFFF",
		yellow: "#E5E533"
	};

	for (const color of ElevatorBlockColors) {
		createFile(
			`{
	"format_version": "1.21.50",
	"minecraft:block": {
		"description": {
			"identifier": "bt:e.${color}_elevator",
			"menu_category": {
				"category": "none"
			}
		},
		"components": {
			"minecraft:custom_components": [
				"bt:e.teleport"
			],
			"minecraft:display_name": "${color[0].toUpperCase() + color.slice(1)} Elevator",
			"minecraft:destructible_by_explosion": {
				"explosion_resistance": 0.8
			},
			// TO DO: Add item_specific_speeds for shears item to be faster
			"minecraft:destructible_by_mining": {
				"seconds_to_destroy": 1.2
			},
			"minecraft:flammable": {
				"catch_chance_modifier": 30,
				"destroy_chance_modifier": 60
			},
			"minecraft:geometry": "minecraft:geometry.full_block",
			"minecraft:material_instances": {
				"*": {
					"texture": "wool_colored_${color !== "light_gray" ? color : "silver"}"
				}
			},
			"minecraft:loot": "loot_tables/blocks/e.${color}_elevator.loot.json",
			"minecraft:map_color": "${ElevatorBlockMapColorMapping[color]}",
			"minecraft:tick": {
				"interval_range": [
					10,
					10
				]
			},
			"minecraft:redstone_conductivity": {
				"redstone_conductor": true
			}
		}
	}
}`,
			`BP/blocks/e.${color}_elevator.json`,
			rootDir
		);
	}
})();
