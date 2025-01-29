import { world, system, ItemUseOnBeforeEvent } from "@minecraft/server";
import { ElevatorsSettings, ElevatorBlockTypes } from "../Models";
import { getSettings, camouflageElevator } from "../Actions";

export const itemUseOnEventSubscription: (arg: ItemUseOnBeforeEvent) => void = world.beforeEvents.itemUseOn.subscribe((itemUseOnEvent: ItemUseOnBeforeEvent): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();

	if (!elevatorsSettings.camouflage) {
		system.run((): void => world.beforeEvents.itemUseOn.unsubscribe(itemUseOnEventSubscription));

		return;
	}

	if (!itemUseOnEvent.isFirstEvent) return;

	const { source: player, block, itemStack: item } = itemUseOnEvent;

	if (!ElevatorBlockTypes.includes(block.typeId)) return;

	// If the player wants to place a block by clicking on the elevator block, then they have to perform sneaking to do so
	if (player.isSneaking) return;

	itemUseOnEvent.cancel = true;

	system.run((): void => camouflageElevator(player, block, item));
});
