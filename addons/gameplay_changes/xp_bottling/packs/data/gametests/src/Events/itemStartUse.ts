/**
 * * itemStartUse Event listeners
 * In this event we listen for when a player uses the xp bottle and do 1 of 2 things
 *  1) set a flag on the player to track if a player has used an item for the configured "use time"
 * 	2) if "instant_use" is enabled, this will interrupt the player currently using the bottle and instead do the corresponding action
 * 		a) filling a bottle
 * 		b) drinking a bottle
 */

import {
	world,
	ItemStartUseAfterEvent
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { XpBottlingsItemTypes } from '../Models';

/**
 * abc
 */
world.afterEvents.itemStartUse.subscribe(({ source, itemStack }: ItemStartUseAfterEvent): void => {
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;
	if (!itemStack.matches(XpBottlingsItemTypes.XpBottle)) return;

	// TODO: when itemStartUse fires, set a DynProp on using player
	// TODO: when itemStartUse fires, start a timeout/interval to check back after configured "use_time" in settings
	// TODO: when itemStartUse fires, check if "instant_use" is enabled and skip setting prop or timeout and jump straight to action
	// TODO: when itemStopUse fires, remove DynProp set above
});
