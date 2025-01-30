import {
	world,
	ItemStopUseAfterEvent
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { updatePlayerSettings } from '../Actions';
import { XpBottlingsItemTypes } from '../Models';

/**
 * * itemStopUse Event listeners
 * In this event we listen for when a player stop using the xp bottle and will
 * remove the dynamic property set on the player so when the timeout/interval checks
 * it will report back false and not follow through into the action
*/

world.afterEvents.itemStopUse.subscribe(({ source, itemStack }: ItemStopUseAfterEvent): void => {
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;
	if (!itemStack?.matches(XpBottlingsItemTypes.XpBottle)) return;

	// // TODO: when itemStopUse fires, remove DynProp set in ./itemStartUse.ts
	void updatePlayerSettings(source, { usingSince: 0 });
});
