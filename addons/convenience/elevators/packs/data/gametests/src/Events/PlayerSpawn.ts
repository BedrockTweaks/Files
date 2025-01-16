import { world, Block, PlayerSpawnAfterEvent } from "@minecraft/server";
import { isElevatorBlockBelow, startElevatorTeleport } from "../Actions";

world.afterEvents.playerSpawn.subscribe((playerSpawnEvent: PlayerSpawnAfterEvent): void => {
	if (!playerSpawnEvent.initialSpawn) return;

	const { player } = playerSpawnEvent;

	const { dimension: playerDimension } = player;

	const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

	if (elevatorBlock) startElevatorTeleport(player, playerDimension, elevatorBlock);
});
