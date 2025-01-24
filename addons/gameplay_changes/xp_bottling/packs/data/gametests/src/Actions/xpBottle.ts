import {
	Player,
	ItemStack,
	EntityInventoryComponent,
	Container,
	EntityComponentTypes
} from '@minecraft/server';
import {
	XpBottlingsItemTypes,
	XpBottleSounds,
	XpBottlingSettings
} from '../Models';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { getSettings } from './settings';

/**
 * Grants the player an XP bottle if they have the required amount.
 *
 * @param {Player} player - The player who is trying to fill an empty bottle with XP.
 */
export const giveXpBottle = (player: Player): void => {
	const xpBottlingSettings: XpBottlingSettings = getSettings();
	const amountString: string = xpBottlingSettings.amountOfXp.toString();

	if (player.getTotalXp() < xpBottlingSettings.amountOfXp) {
		void player.onScreenDisplay.setActionBar({ translate: 'bt:xb.xp.invalid' });

		return;
	}

	void removeItemFromHand(player, MinecraftItemTypes.GlassBottle, 1);
	void reduceXP(player, xpBottlingSettings.amountOfXp);

	// following line just displays a useful bit of info on the action bar to state what happened.
	void player.onScreenDisplay.setActionBar({ translate: 'bt:xb.xp.decrease', with: [amountString] });
	void player.dimension.spawnItem(new ItemStack(XpBottlingsItemTypes.XpBottle, 1), player.location);
	void player.playSound(XpBottleSounds.fillBottle, { volume: 0.5, pitch: 3.5 });
};

/**
 * Removes one item from the held item stack.
 *
 * @param {Player} player - The player to have the item removed from.
 * @param {string} item - The item name to remove.
 * @param {number} amount - The number of items to remove.
 */
export const removeItemFromHand = (player: Player, item: string, amount: number): void => {
	const playerComponent = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerInventory = playerComponent.container as Container;
	const playerStack = playerInventory.getItem(player.selectedSlotIndex) as ItemStack;

	void playerInventory.setItem(player.selectedSlotIndex, undefined);

	if (playerStack.amount > amount) {
		void playerInventory.setItem(player.selectedSlotIndex, new ItemStack(item, playerStack.amount - amount));
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

	return true;
};
