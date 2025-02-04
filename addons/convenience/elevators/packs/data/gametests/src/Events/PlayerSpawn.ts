import { world, Player, Block, PlayerSpawnAfterEvent } from '@minecraft/server';
import { isElevatorBlockBelow, startElevatorTeleport } from '../Actions';

/**
 * In this event, we listen to player joining the world and checking if they are on top
 * of an elevator block, if they are, then we will start the elevator teleport process for them.
 */
world.afterEvents.playerSpawn.subscribe((playerSpawnEvent: PlayerSpawnAfterEvent): void => {
	if (!playerSpawnEvent.initialSpawn) return;

	const { player }: PlayerSpawnAfterEvent = playerSpawnEvent;

	const { dimension: playerDimension }: Player = player;

	const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

	if (elevatorBlock) {
		startElevatorTeleport(player, playerDimension, elevatorBlock);
	}
});
