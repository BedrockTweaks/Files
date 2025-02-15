import { world, system, ItemUseOnBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { camouflageElevator } from '../Actions';

/**
 * In this event, we listen to all the items being interacted on an elevator block,
 * if the item interacted is a full block and the camouflage setting is turned on,
 * then the elevator block will be camouflaged as the same texture as the full block item interacted.
 * If the player is sneaking, then we will not run the camouflage elevator function.
 */
export const itemUseOnEventSubscription: (arg: ItemUseOnBeforeEvent) => void = world.beforeEvents.itemUseOn.subscribe((itemUseOnEvent: ItemUseOnBeforeEvent): void => {
	if (!itemUseOnEvent.isFirstEvent) return;

	const { source: player, block, itemStack: item }: ItemUseOnBeforeEvent = itemUseOnEvent;

	if (!ElevatorBlockTypes.includes(block.typeId)) return;

	// If the player wants to place a block by clicking on the elevator block, then they have to perform sneaking to do so
	if (player.isSneaking) return;

	itemUseOnEvent.cancel = true;

	system.run((): void => camouflageElevator(player, block, item));
});
