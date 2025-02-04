import { world, Block, PlayerBreakBlockBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { stopNearbyPlayersElevatorTeleport, deleteElevatorBlockSettings } from '../Actions';

/**
 * In this event, we listen to the player breaking an elevator block,
 * then we will stop all the players who are standing on top of this elevator block their elevator teleport process
 * and we will delete its elevator block settings.
 */
world.beforeEvents.playerBreakBlock.subscribe((playerBreakBlockEvent: PlayerBreakBlockBeforeEvent): void => {
	const { dimension, block: elevatorBlock }: PlayerBreakBlockBeforeEvent = playerBreakBlockEvent;
	const { typeId: elevatorBlockTypeId, location: elevatorBlockLocation }: Block = elevatorBlock;

	stopNearbyPlayersElevatorTeleport(dimension, elevatorBlockTypeId, elevatorBlockLocation);
	deleteElevatorBlockSettings(elevatorBlock);
}, { blockTypes: ElevatorBlockTypes });
