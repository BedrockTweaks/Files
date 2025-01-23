import { world, system, ItemUseOnBeforeEvent } from "@minecraft/server";
import { ElevatorBlockTypes } from "../Models";
import { camouflageElevator } from "../Actions";

world.beforeEvents.itemUseOn.subscribe((itemUseOnEvent: ItemUseOnBeforeEvent): void => {
	// TODO: This event will only be subscribed when allow camouflage config is set to true

	if (!itemUseOnEvent.isFirstEvent) return;

	const { source: player, block, itemStack: item } = itemUseOnEvent;

	if (!ElevatorBlockTypes.includes(block.typeId)) return;

	itemUseOnEvent.cancel = true;

	system.run((): void => camouflageElevator(player, block, item));
});
