import { Player, ItemStack } from '@minecraft/server';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import {
	getSettings,
	getPlayerSettings,
	removeItemFromHand,
	placeItemInHand,
	updatePlayerSettings
} from '../Actions';
import {
	XpBottlingsItemTypes,
	XpBottleSounds,
	XpBottlingSettings,
	PlayerXpBottlingSettings
} from '../Models';

/**
 * Grants the player an XP bottle if they have the required amount.
 *
 * @param {Player} player - The player who is trying to fill an empty bottle with XP.
 * @param {ItemStack} itemStack - The stack of items that was used to trigger the XP bottle generation.
 */
export const giveXpBottle = (player: Player, itemStack: ItemStack): void => {
	const { amountOfXp, enableStackCrafting }: XpBottlingSettings = getSettings();
	const { enableToolTips, fillFullStack, recievedBook }: PlayerXpBottlingSettings = getPlayerSettings(player);
	const currentXp: number = player.getTotalXp();

	if (player.isSneaking && !enableStackCrafting) {
		if (enableToolTips) {
			void player.sendMessage({ translate: 'bt.xb.tooltip.worldDisabled', with: { rawtext: [{ text: '\n' },	{ translate: 'bt.xb.misc.stackCraft' }] } });
		}

		return;
	}
	if (player.isSneaking && !fillFullStack) {
		if (enableToolTips) {
			void player.sendMessage({ translate: 'bt.xb.tooltip.playerDisabled', with: { rawtext: [{ text: '\n' },	{ translate: 'bt.xb.misc.stackCraft' }] } });
		}

		return;
	}

	if (currentXp < amountOfXp) {
		if (enableToolTips) {
			void player.onScreenDisplay.setActionBar({ translate: 'bt.xb.tooltip.notEnough' });
		}

		return;
	}

	if (!player.isSneaking) {
		// single bottle filling
		void removeItemFromHand(player, MinecraftItemTypes.GlassBottle, 1);
		void reduceXP(player, amountOfXp);

		if (enableToolTips) {
			void player.onScreenDisplay.setActionBar({ translate: 'bt.xb.tooltip.decrease', with: [amountOfXp.toString()] });
		}
		void placeItemInHand(player, XpBottlingsItemTypes.XpBottle, 1);

		// randomise the pitch to make the sounds more interesting.
		const pitchIndex: number = Math.round(Math.random() * 2);
		const pitches: number[] = [0.3, 0.4, 0.5];

		void player.playSound(XpBottleSounds.fillBottle, { volume: 0.5, pitch: pitches[pitchIndex] });
	} else {
		// stack bottle filling
		const numFillableBottles: number = Math.floor(currentXp / amountOfXp);
		const bottlesToFill: number = Math.min(itemStack.amount, numFillableBottles);

		void removeItemFromHand(player, MinecraftItemTypes.GlassBottle, bottlesToFill);
		void massReduceXP(player, bottlesToFill * amountOfXp);

		if (enableToolTips) {
			void player.onScreenDisplay.setActionBar({ translate: 'bt.xb.tooltip.decrease', with: [(bottlesToFill * amountOfXp).toString()] });
		}
		void placeItemInHand(player, XpBottlingsItemTypes.XpBottle, bottlesToFill);

		void player.playSound(XpBottleSounds.fillStack, { volume: 0.5, pitch: 1.5 });
	}

	if (!recievedBook) {
		player.dimension.spawnItem(new ItemStack(XpBottlingsItemTypes.guideBook, 1), player.location);
		void updatePlayerSettings(player, { recievedBook: true });
	}
};

/**
 * Takes a given player and removes a fixed amount of XP from them respecting overflow.
 *
 * @param {Player} player - The player whose experience is to be reduced.
 * @param {number} amount - The amount of XP to remove from the player.
 * @returns true if the operation was successful and XP could be removed, else returns false.
 */
export const reduceXP = (player: Player, amount: number): boolean => {
	if (player.getTotalXp() < amount) {
		return false;
	}

	if (player.xpEarnedAtCurrentLevel >= amount) {
		void player.addExperience(-amount);
	} else {
		let remainder: number = amount - player.xpEarnedAtCurrentLevel;

		void player.addExperience(-player.xpEarnedAtCurrentLevel);

		do {
			void player.addLevels(-1);
			remainder = remainder - player.totalXpNeededForNextLevel;
		} while (remainder > 0);

		void player.addExperience(Math.abs(remainder));
	}

	return true;
};

/**
 * Takes a given player and removes a fixed amount of XP from them respecting overflow.
 * This function should be used for instances where you want to clear multiple / all levels from a player or as a one off interaction.
 *
 * @param {Player} player - The player whose experience is to be reduced.
 * @param {number} amount - The amount of XP to remove from the player.
 * @returns true if the operation was successful and XP could be removed, else returns false.
 */
export const massReduceXP = (player: Player, amount: number): boolean => {
	const currentXP: number = player.getTotalXp();
	if (currentXP < amount) return false;
	void player.addLevels(-24791); // max limit for XP level in 32bit integer
	void player.addExperience(-16777216); // max limit for XP earnt in 32bit interger
	const returnedXP: number = currentXP - amount;
	void player.addExperience(returnedXP);
	player.dimension.runCommand(`stopsound ${player.name} random.levelup`); // suppress extra level up sound

	return true;
};
