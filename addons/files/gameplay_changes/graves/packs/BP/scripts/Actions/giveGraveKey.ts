import { Container, EntityComponentTypes, EntityInventoryComponent, ItemStack, Player } from '@minecraft/server';
import { GravesItemTypes } from '../Models';

/**
 * Adds a Grave Key item to the player's inventory.
 *
 * @param {Player} player - The player to which the Grave Key will be given.
 */
export const giveGraveKey = (player: Player): void => {
	const playerInventory: EntityInventoryComponent | undefined = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent | undefined;
	const playerContainer: Container | undefined = playerInventory?.container;

	playerContainer?.addItem(new ItemStack(GravesItemTypes.GraveKey));
};
