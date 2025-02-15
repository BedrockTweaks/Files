import { world, PlayerLeaveBeforeEvent } from '@minecraft/server';
import { stopElevatorTeleport } from '../Actions';

/**
 * In this event, we listen to player leaving the world so that we will stop
 * the elevator teleport process for the player only if they have the elevator teleport system run identifier stored
 * in their dynamic properties.
 */
world.beforeEvents.playerLeave.subscribe((playerLeaveEvent: PlayerLeaveBeforeEvent): void => {
	const { player }: PlayerLeaveBeforeEvent = playerLeaveEvent;

	stopElevatorTeleport(player);
});
