// * We are using Block.isSolid so, please make sure to use beta version of @minecraft/server module

// ! NOTE: If any new additions of blocks are done, then this code will alphabetically sort them in an array, but the camouflage elevator block states are changed based
// ! on the index number of the array, so the index number might change because sorting them alphabetically which will cause the already loaded camouflaged elevator block
// ! to have different texture, to fix this we need to add the new blocks at the end of the array regardless of the alphabetically order of the array
// ! In the next update, I will update the script to make sure that newer blocks are added at the end of the array

import { world, Block, Vector3, PlayerSpawnAfterEvent } from '@minecraft/server';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';

// Blocks which aren't considered "solid" by the Block.isSolid but they should be an exception then, we have to make exceptions for them
const exceptionBlocksList: string[] = [
	// Glass
	MinecraftBlockTypes.Glass,
	MinecraftBlockTypes.TintedGlass,
	MinecraftBlockTypes.BlackStainedGlass,
	MinecraftBlockTypes.BlueStainedGlass,
	MinecraftBlockTypes.BrownStainedGlass,
	MinecraftBlockTypes.CyanStainedGlass,
	MinecraftBlockTypes.GrayStainedGlass,
	MinecraftBlockTypes.GreenStainedGlass,
	MinecraftBlockTypes.LightBlueStainedGlass,
	MinecraftBlockTypes.LightGrayStainedGlass,
	MinecraftBlockTypes.LimeStainedGlass,
	MinecraftBlockTypes.MagentaStainedGlass,
	MinecraftBlockTypes.OrangeStainedGlass,
	MinecraftBlockTypes.PinkStainedGlass,
	MinecraftBlockTypes.PurpleStainedGlass,
	MinecraftBlockTypes.RedStainedGlass,
	MinecraftBlockTypes.WhiteStainedGlass,
	MinecraftBlockTypes.YellowStainedGlass,
	// Ice
	MinecraftBlockTypes.Ice,
];
// Education blocks, unknown block and blocks that require rendering method which is currently not exposed are excluded as we can't change their texture to replicate them exactly
const excludeBlocksList: string[] = [
	MinecraftBlockTypes.AcaciaLeaves,
	MinecraftBlockTypes.AzaleaLeaves,
	MinecraftBlockTypes.AzaleaLeavesFlowered,
	MinecraftBlockTypes.Barrier,
	MinecraftBlockTypes.Beacon,
	MinecraftBlockTypes.BirchLeaves,
	MinecraftBlockTypes.BlackShulkerBox,
	MinecraftBlockTypes.BlueShulkerBox,
	MinecraftBlockTypes.BrownShulkerBox,
	MinecraftBlockTypes.Cauldron,
	MinecraftBlockTypes.ChemicalHeat,
	MinecraftBlockTypes.CherryLeaves,
	MinecraftBlockTypes.Composter,
	MinecraftBlockTypes.CyanShulkerBox,
	MinecraftBlockTypes.DarkOakLeaves,
	MinecraftBlockTypes.Element0,
	MinecraftBlockTypes.Element1,
	MinecraftBlockTypes.Element2,
	MinecraftBlockTypes.Element3,
	MinecraftBlockTypes.Element4,
	MinecraftBlockTypes.Element5,
	MinecraftBlockTypes.Element6,
	MinecraftBlockTypes.Element7,
	MinecraftBlockTypes.Element8,
	MinecraftBlockTypes.Element9,
	MinecraftBlockTypes.Element10,
	MinecraftBlockTypes.Element11,
	MinecraftBlockTypes.Element12,
	MinecraftBlockTypes.Element13,
	MinecraftBlockTypes.Element14,
	MinecraftBlockTypes.Element15,
	MinecraftBlockTypes.Element16,
	MinecraftBlockTypes.Element17,
	MinecraftBlockTypes.Element18,
	MinecraftBlockTypes.Element19,
	MinecraftBlockTypes.Element20,
	MinecraftBlockTypes.Element21,
	MinecraftBlockTypes.Element22,
	MinecraftBlockTypes.Element23,
	MinecraftBlockTypes.Element24,
	MinecraftBlockTypes.Element25,
	MinecraftBlockTypes.Element26,
	MinecraftBlockTypes.Element27,
	MinecraftBlockTypes.Element28,
	MinecraftBlockTypes.Element29,
	MinecraftBlockTypes.Element30,
	MinecraftBlockTypes.Element31,
	MinecraftBlockTypes.Element32,
	MinecraftBlockTypes.Element33,
	MinecraftBlockTypes.Element34,
	MinecraftBlockTypes.Element35,
	MinecraftBlockTypes.Element36,
	MinecraftBlockTypes.Element37,
	MinecraftBlockTypes.Element38,
	MinecraftBlockTypes.Element39,
	MinecraftBlockTypes.Element40,
	MinecraftBlockTypes.Element41,
	MinecraftBlockTypes.Element42,
	MinecraftBlockTypes.Element43,
	MinecraftBlockTypes.Element44,
	MinecraftBlockTypes.Element45,
	MinecraftBlockTypes.Element46,
	MinecraftBlockTypes.Element47,
	MinecraftBlockTypes.Element48,
	MinecraftBlockTypes.Element49,
	MinecraftBlockTypes.Element50,
	MinecraftBlockTypes.Element51,
	MinecraftBlockTypes.Element52,
	MinecraftBlockTypes.Element53,
	MinecraftBlockTypes.Element54,
	MinecraftBlockTypes.Element55,
	MinecraftBlockTypes.Element56,
	MinecraftBlockTypes.Element57,
	MinecraftBlockTypes.Element58,
	MinecraftBlockTypes.Element59,
	MinecraftBlockTypes.Element60,
	MinecraftBlockTypes.Element61,
	MinecraftBlockTypes.Element62,
	MinecraftBlockTypes.Element63,
	MinecraftBlockTypes.Element64,
	MinecraftBlockTypes.Element65,
	MinecraftBlockTypes.Element66,
	MinecraftBlockTypes.Element67,
	MinecraftBlockTypes.Element68,
	MinecraftBlockTypes.Element69,
	MinecraftBlockTypes.Element70,
	MinecraftBlockTypes.Element71,
	MinecraftBlockTypes.Element72,
	MinecraftBlockTypes.Element73,
	MinecraftBlockTypes.Element74,
	MinecraftBlockTypes.Element75,
	MinecraftBlockTypes.Element76,
	MinecraftBlockTypes.Element77,
	MinecraftBlockTypes.Element78,
	MinecraftBlockTypes.Element79,
	MinecraftBlockTypes.Element80,
	MinecraftBlockTypes.Element81,
	MinecraftBlockTypes.Element82,
	MinecraftBlockTypes.Element83,
	MinecraftBlockTypes.Element84,
	MinecraftBlockTypes.Element85,
	MinecraftBlockTypes.Element86,
	MinecraftBlockTypes.Element87,
	MinecraftBlockTypes.Element88,
	MinecraftBlockTypes.Element89,
	MinecraftBlockTypes.Element90,
	MinecraftBlockTypes.Element91,
	MinecraftBlockTypes.Element92,
	MinecraftBlockTypes.Element93,
	MinecraftBlockTypes.Element94,
	MinecraftBlockTypes.Element95,
	MinecraftBlockTypes.Element96,
	MinecraftBlockTypes.Element97,
	MinecraftBlockTypes.Element98,
	MinecraftBlockTypes.Element99,
	MinecraftBlockTypes.Element100,
	MinecraftBlockTypes.Element101,
	MinecraftBlockTypes.Element102,
	MinecraftBlockTypes.Element103,
	MinecraftBlockTypes.Element104,
	MinecraftBlockTypes.Element105,
	MinecraftBlockTypes.Element106,
	MinecraftBlockTypes.Element107,
	MinecraftBlockTypes.Element108,
	MinecraftBlockTypes.Element109,
	MinecraftBlockTypes.Element110,
	MinecraftBlockTypes.Element111,
	MinecraftBlockTypes.Element112,
	MinecraftBlockTypes.Element113,
	MinecraftBlockTypes.Element114,
	MinecraftBlockTypes.Element115,
	MinecraftBlockTypes.Element116,
	MinecraftBlockTypes.Element117,
	MinecraftBlockTypes.Element118,
	MinecraftBlockTypes.GrassBlock,
	MinecraftBlockTypes.GrayShulkerBox,
	MinecraftBlockTypes.GreenShulkerBox,
	MinecraftBlockTypes.HoneyBlock,
	MinecraftBlockTypes.JungleLeaves,
	MinecraftBlockTypes.LightBlueShulkerBox,
	MinecraftBlockTypes.LightGrayShulkerBox,
	MinecraftBlockTypes.LimeShulkerBox,
	MinecraftBlockTypes.MagentaShulkerBox,
	MinecraftBlockTypes.MangroveLeaves,
	MinecraftBlockTypes.OakLeaves,
	MinecraftBlockTypes.OrangeShulkerBox,
	MinecraftBlockTypes.PaleOakLeaves,
	MinecraftBlockTypes.PinkShulkerBox,
	MinecraftBlockTypes.PurpleShulkerBox,
	MinecraftBlockTypes.RedShulkerBox,
	MinecraftBlockTypes.Scaffolding,
	MinecraftBlockTypes.Slime,
	MinecraftBlockTypes.SpruceLeaves,
	MinecraftBlockTypes.UnderwaterTnt,
	MinecraftBlockTypes.UndyedShulkerBox,
	MinecraftBlockTypes.Unknown,
	MinecraftBlockTypes.WhiteShulkerBox,
	MinecraftBlockTypes.YellowShulkerBox,
];

const vanillaFullBlocksList: string[] = [];

world.afterEvents.playerSpawn.subscribe((playerSpawnEvent: PlayerSpawnAfterEvent): void => {
	if (!playerSpawnEvent.initialSpawn) return;

	const { player } = playerSpawnEvent;

	const { location: playerLocation, dimension } = player;

	const blockLocation: Vector3 = { x: playerLocation.x, y: dimension.heightRange.max - 1, z: playerLocation.z };

	const originalBlockTypeId: string = dimension.getBlock(blockLocation)!.typeId;

	for (const blockId of Object.values(MinecraftBlockTypes)) {
		if (excludeBlocksList.includes(blockId)) continue;

		if (exceptionBlocksList.includes(blockId)) {
			vanillaFullBlocksList.push(blockId);

			continue;
		}

		dimension.setBlockType(blockLocation, blockId);

		const block: Block = dimension.getBlock(blockLocation) as Block;

		if (block.isSolid) {
			vanillaFullBlocksList.push(blockId);
		}
	}

	dimension.setBlockType(blockLocation, originalBlockTypeId);

	console.warn(JSON.stringify(vanillaFullBlocksList));
});
