import {
	world,
	system,
	ItemUseOnBeforeEvent
} from '@minecraft/server';
import {
	MinecraftBlockTypes,
	MinecraftEntityTypes,
	MinecraftItemTypes
} from '@minecraft/vanilla-data';
import { giveBottle } from '../Actions/xpBottle';

world.beforeEvents.itemUseOn.subscribe(async(itemUseOnEvent: ItemUseOnBeforeEvent): Promise<void> => {
	const { source, block, itemStack } = itemUseOnEvent;
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;

	if (!itemStack.matches(MinecraftItemTypes.GlassBottle)) return; // check player used glass bottle
	if (!block.matches(MinecraftBlockTypes.EnchantingTable)) return; // check player is using bottle on enchanting table

	itemUseOnEvent.cancel = true;

	await system.waitTicks(1);

	void giveBottle(source);
});
