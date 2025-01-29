import { world, PlayerBreakBlockBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { stopNearbyPlayersElevatorTeleport, deleteElevatorBlockSettings } from '../Actions';

world.beforeEvents.playerBreakBlock.subscribe((playerBreakBlockEvent: PlayerBreakBlockBeforeEvent): void => {
	const { dimension, block: elevatorBlock } = playerBreakBlockEvent;
	const { typeId: elevatorBlockTypeId, location: elevatorBlockLocation } = elevatorBlock;

	stopNearbyPlayersElevatorTeleport(dimension, elevatorBlockTypeId, elevatorBlockLocation);
	deleteElevatorBlockSettings(elevatorBlock);
}, { blockTypes: ElevatorBlockTypes });
