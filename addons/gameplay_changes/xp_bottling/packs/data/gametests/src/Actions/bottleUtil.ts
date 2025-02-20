import {
	system,
	Player,
	EntityComponentTypes,
	EntityInventoryComponent,
	Container,
	ItemStack,
	ItemLockMode
} from '@minecraft/server';

/**
 * Removes one item from the held item stack.
 *
 * @param {Player} player - The player to have the item removed from.
 * @param {string} item - The item to remove from the player.
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

/**
 * Gives the player an amount of the item specified directly to inventory,
 * or spawns it on the ground if their inventory is full.
 *
 * @param {Player} player - The player to give the item to.
 * @param {string} item - The item to give to the player.
 * @param {number} amount - The amount of items to give to the player.
 */
export const placeItemInHand = (player: Player, item: string, amount: number): void => {
	if (!player.hasComponent(EntityComponentTypes.Inventory)) return;
	const playerInventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerContainer = playerInventory.container as Container;

	if (playerContainer.emptySlotsCount) {
		// has space in inventory
		playerContainer.addItem(new ItemStack(item, amount));
	} else {
		// doesnt have space in inventory
		player.dimension.spawnItem(new ItemStack(item, amount), player.location);
	}
};

/**
 * Locks and then quickly unlocks the players held item to cancel any use
 * animations, this is neccessary when functions like stackCraft & stackUse
 * are disabled server side or client side.
 *
 * @param {Player} player - The player to quickly lock/unlock their item.
 */
export const lockHeldItem = async(player: Player): Promise<void> => {
	if (!player.hasComponent(EntityComponentTypes.Inventory)) return;

	const playerInventory = player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent;
	const playerContainer = playerInventory.container as Container;
	const itemSlot = playerContainer.getSlot(player.selectedSlotIndex);
	itemSlot.lockMode = ItemLockMode.slot;
	await system.waitTicks(2);
	itemSlot.lockMode = ItemLockMode.none;
};
