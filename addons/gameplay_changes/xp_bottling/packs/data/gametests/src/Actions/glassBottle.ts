import {
	Player,
	ItemStack
} from '@minecraft/server';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import {
	getPlayerSettings,
	getSettings,
	removeItemFromHand,
	placeItemInHand,
	lockHeldItem
} from '../Actions';
import {
	PlayerXpBottlingSettings,
	XpBottleSounds,
	XpBottlingSettings,
	XpBottlingsItemTypes
} from '../Models';

export const giveGlassBottle = (player: Player, itemStack: ItemStack): void => {
	const { amountOfXp, enableStackConsume }: XpBottlingSettings = getSettings();
	const { enableToolTips, consumeFullStack }: PlayerXpBottlingSettings = getPlayerSettings(player);

	if (player.isSneaking && !enableStackConsume) {
		if (enableToolTips) {
			void player.sendMessage({ translate: 'bt.xb.tooltip.worldDisabled', with: { rawtext: [{ text: '\n' },	{ translate: 'bt.xb.misc.stackConsume' }] } });
		}
		lockHeldItem(player);

		return;
	}
	if (player.isSneaking && !consumeFullStack) {
		if (enableToolTips) {
			void player.sendMessage({ translate: 'bt.xb.tooltip.playerDisabled', with: { rawtext: [{ text: '\n' },	{ translate: 'bt.xb.misc.stackConsume' }] } });
		}
		lockHeldItem(player);

		return;
	}

	if (!player.isSneaking) {
		// single bottle drinking
		void removeItemFromHand(player, XpBottlingsItemTypes.XpBottle, 1);
		void player.addExperience(amountOfXp);

		if (enableToolTips) {
			void player.onScreenDisplay.setActionBar({ translate: 'bt.xb.tooltip.increase', with: [amountOfXp.toString()] });
		}
		void placeItemInHand(player, MinecraftItemTypes.GlassBottle, 1);

		const pitchIndex: number = Math.round(Math.random() * 3);
		const pitches: number[] = [1, 1.1, 1.2, 1.3];

		void player.playSound(XpBottleSounds.fillBottle, { volume: 0.5, pitch: pitches[pitchIndex] });
	} else {
		// stack consume
		const numOfBottles: number = itemStack.amount;

		void removeItemFromHand(player, XpBottlingsItemTypes.XpBottle, numOfBottles);
		void player.addExperience(numOfBottles * amountOfXp);
		if (enableToolTips) {
			void player.onScreenDisplay.setActionBar({ translate: 'bt.xb.tooltip.increase', with: [(numOfBottles * amountOfXp).toString()] });
		}
		void placeItemInHand(player, MinecraftItemTypes.GlassBottle, numOfBottles);

		void player.playSound(XpBottleSounds.drinkStack, { volume: 0.5, pitch: 1.5 });
	}
};
