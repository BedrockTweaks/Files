/**
 * * itemStopUse Event listeners
 * In this event we listen for when a player stop using the xp bottle and will
 * remove the dynamic property set on the player so when the timeout/interval checks
 * it will report back false and not follow through into the action
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

	// TODO: when itemStopUse fires, remove DynProp set in ./itemStartUse.ts
});
