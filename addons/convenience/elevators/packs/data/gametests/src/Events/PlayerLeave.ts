import { world, PlayerLeaveBeforeEvent } from "@minecraft/server";
import { stopElevatorTeleport } from "../Actions";

world.beforeEvents.playerLeave.subscribe((playerLeaveEvent: PlayerLeaveBeforeEvent): void => {
	const { player } = playerLeaveEvent;

	stopElevatorTeleport(player);
});
