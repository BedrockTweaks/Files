import { ItemStack, EntityComponentTypes, Player, Container, EntityInventoryComponent } from '@minecraft/server';

/**
 * @name giveElevatorBlock
 * @param {Player} player - The player which has to be given the elevator block.
 * @param {string} color - The color of the elevator block to give.
 * @remarks Gives an elevator block to the player based on the color provided.
 */
export const giveElevatorBlock = (player: Player, color: string): void => {
	const playerInventory: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent).container!;

	if (playerInventory.emptySlotsCount === 0) {
		player.sendMessage({ translate: 'bt.elevators.no_empty_slot' });

		return;
	}

	playerInventory.addItem(new ItemStack(`bt:e.${color}_elevator`));
};
