import { world, Player, Block, PlayerSpawnAfterEvent } from '@minecraft/server';
import { isElevatorBlockBelow, startElevatorTeleport } from '../Actions';

world.afterEvents.playerSpawn.subscribe((playerSpawnEvent: PlayerSpawnAfterEvent): void => {
	if (!playerSpawnEvent.initialSpawn) return;

	const { player }: PlayerSpawnAfterEvent = playerSpawnEvent;

	const { dimension: playerDimension }: Player = player;

	const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

	if (elevatorBlock) {
		startElevatorTeleport(player, playerDimension, elevatorBlock);
	}
});
