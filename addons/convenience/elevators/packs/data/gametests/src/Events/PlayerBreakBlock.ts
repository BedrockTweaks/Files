import { world, Block, PlayerBreakBlockBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { stopNearbyPlayersElevatorTeleport, deleteElevatorBlockSettings } from '../Actions';

world.beforeEvents.playerBreakBlock.subscribe((playerBreakBlockEvent: PlayerBreakBlockBeforeEvent): void => {
	const { dimension, block: elevatorBlock }: PlayerBreakBlockBeforeEvent = playerBreakBlockEvent;
	const { typeId: elevatorBlockTypeId, location: elevatorBlockLocation }: Block = elevatorBlock;

	stopNearbyPlayersElevatorTeleport(dimension, elevatorBlockTypeId, elevatorBlockLocation);
	deleteElevatorBlockSettings(elevatorBlock);
}, { blockTypes: ElevatorBlockTypes });
