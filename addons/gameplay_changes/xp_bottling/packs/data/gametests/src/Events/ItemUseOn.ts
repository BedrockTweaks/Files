/**
 * * itemUseOn Event listeners
 * In this event we listen for when a player uses an empty glass bottle on an enchanting table
 * and cancel that interaction before we start processing the reponse action of storing the
 * players XP in bottle/s
*/

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
import { giveXpBottle } from '../Actions';

world.beforeEvents.itemUseOn.subscribe(async(itemUseOnEvent: ItemUseOnBeforeEvent): Promise<void> => {
	const { source, block, itemStack } = itemUseOnEvent;
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;

	if (!itemStack.matches(MinecraftItemTypes.GlassBottle)) return; // check player used glass bottle
	if (!block.matches(MinecraftBlockTypes.EnchantingTable)) return; // check player is using bottle on enchanting table

	itemUseOnEvent.cancel = true;

	await system.waitTicks(1);

	void giveXpBottle(source, itemStack);
});
