import { world, PlayerBreakBlockBeforeEvent } from "@minecraft/server";
import { ElevatorBlockTypes } from "../Models";
import { stopNearbyPlayersElevatorTeleport } from "../Actions";

world.beforeEvents.playerBreakBlock.subscribe((playerBreakBlock: PlayerBreakBlockBeforeEvent): void => {
	const { dimension, block: elevatorBlock } = playerBreakBlock;
	const { typeId: elevatorBlockTypeId, location: elevatorBlockLocation } = elevatorBlock;

	stopNearbyPlayersElevatorTeleport(dimension, elevatorBlockTypeId, elevatorBlockLocation);
}, { blockTypes: ElevatorBlockTypes });
