import {
	system,
	Player,
	EntityComponentTypes,
	EntityInventoryComponent,
	Container,
	ItemLockMode,
	ItemStack
} from '@minecraft/server';

/**
 * Removes one item from the held item stack.
 *
 * @param {Player} player - The player to have the item removed from.
 * @param {string} item - The item name to remove.
 * @param {number} amount - The number of items to remove.
 */
export const removeItemFromHand = (player: Player, item: string, amount: number): void => {
	if (!player.hasComponent(EntityComponentTypes.Inventory)) return;
	const playerInventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerContainer = playerInventory.container as Container;
	const itemSlot = playerContainer.getSlot(player.selectedSlotIndex);

	if (itemSlot.amount > amount) {
		itemSlot.amount = itemSlot.amount - amount;
	} else {
		itemSlot.setItem(undefined);
	}
};

export const placeItemInHand = (player: Player, item: string, amount: number): void => {
	if (!player.hasComponent(EntityComponentTypes.Inventory)) return;
	const playerInventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerContainer = playerInventory.container as Container;

	playerContainer.addItem(new ItemStack(item, amount));
};

export const lockHeldItem = async(player: Player): Promise<void> => {
	if (!player.hasComponent(EntityComponentTypes.Inventory)) return;

	const playerInventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerContainer = playerInventory.container as Container;
	const itemSlot = playerContainer.getSlot(player.selectedSlotIndex);
	itemSlot.lockMode = ItemLockMode.slot;
	await system.waitTicks(2);
	itemSlot.lockMode = ItemLockMode.none;
};
