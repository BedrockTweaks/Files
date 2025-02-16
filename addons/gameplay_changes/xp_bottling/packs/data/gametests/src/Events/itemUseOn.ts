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
import { getSettings, giveXpBottle } from '../Actions';
import { XpBottlingSettings } from '../Models';

/**
 * * itemUseOn Event listeners
 * In this event we listen for when a player uses an empty glass bottle on an
 * enchanting table and cancel that interaction before we start processing the
 * reponse action of storing the players XP in bottle/s
*/

world.beforeEvents.itemUseOn.subscribe(async(itemUseOnEvent: ItemUseOnBeforeEvent): Promise<void> => {
	const { source, block, itemStack, isFirstEvent } = itemUseOnEvent;

	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;
	if (!itemStack.matches(MinecraftItemTypes.GlassBottle)) return;
	if (!block.matches(MinecraftBlockTypes.EnchantingTable)) return;
	if (!isFirstEvent && source.isSneaking) return;

	const { initialized }: XpBottlingSettings = getSettings();
	if (!initialized) {
		source.sendMessage({ translate: 'bt.xb.misc.notInitialized', with: ['\n'] });

		return;
	}

	itemUseOnEvent.cancel = true;
	await system.waitTicks(1);

	void giveXpBottle(source, itemStack);
});
