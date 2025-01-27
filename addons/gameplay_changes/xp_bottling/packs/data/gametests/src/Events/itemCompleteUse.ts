import {
	world,
	ItemCompleteUseAfterEvent
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { PlayerXpBottlingSettings, XpBottlingSettings, XpBottlingsItemTypes } from '../Models';
import { getPlayerSettings, getSettings } from '../Actions';

// TODO: convert to itemStartUse & itemStopUse instead of itemCompleteUse to facilitate toggle for "instant use"
/**
 * Listens for when XP Bottles are "drank" based on the static use_modifier set within the XP Bottle.item.json
 * @deprecated
 */
world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }: ItemCompleteUseAfterEvent) => {
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;
	if (!itemStack.matches(XpBottlingsItemTypes.XpBottle)) return;

	const { amountOfXp }: XpBottlingSettings = getSettings();
	const { enableToolTips }: PlayerXpBottlingSettings = getPlayerSettings(source);

	if (enableToolTips) {
		void source.onScreenDisplay.setActionBar({ translate: 'bt.xb.xp.increase', with: [amountOfXp.toString()] });
	}
	void source.addExperience(amountOfXp);
});
