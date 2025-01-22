import {
	Player,
	ItemStack,
	EntityInventoryComponent,
	Container,
	EntityComponentTypes
} from '@minecraft/server';
import {
	XpBottlingsItemTypes,
	XpBottleSounds
} from '../Models';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';

/**
 * Grants the player an XP bottle if they have the required amount.
 *
 * @param {Player} player - The player who is trying to fill an empty bottle with XP.
 */
export const giveBottle = (player: Player): void => {
	if (player.getTotalXp() < 16) {
		void player.dimension.runCommand(`title ${player.name} actionbar §rNot enough XP§r`);

		return;
	} // check player has atleast 16 xp

	void removeItemFromHand(player, MinecraftItemTypes.GlassBottle, 1);
	void reduceXP(player, 16);

	// following line just displays a useful bit of info on the action bar to state what happened.
	void player.dimension.runCommand(`title ${player.name} actionbar §r§o§6-16 XP§r`);
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
 */
export const reduceXP = (player: Player, amount: number): void => {
	if (player.xpEarnedAtCurrentLevel >= amount) {
		void player.addExperience(-amount);
	} else {
		/*
		 * This math is here to ensure lossless XP
		 * Essentially, we have to manually calculate the spill over if someone has say 5 XP over a level
		 * if we just did -16, it would remove the 5, but NOT tick down into the level below, this ensures we do and no free xp is given.
		 * -Squatch
		*/
		// TODO: fix edge case that total XP being divisable by {amount} will cause free XP to be awarded.
		const remainder = amount - player.xpEarnedAtCurrentLevel;
		void player.addExperience(-player.xpEarnedAtCurrentLevel);
		void player.addLevels(-1);
		const reimburse = player.totalXpNeededForNextLevel - remainder;
		void player.addExperience(reimburse);
	}
};
