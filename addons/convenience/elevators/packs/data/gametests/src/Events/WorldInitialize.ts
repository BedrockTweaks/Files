import { world, Player, Block, WorldInitializeBeforeEvent, BlockComponentStepOnEvent, BlockComponentStepOffEvent, BlockComponentTickEvent } from "@minecraft/server";
import { ElevatorsBlockCustomComponents, ElevatorsDynamicProperties } from "../Models";
import { startElevatorTeleport, stopElevatorTeleport, tickElevatorParticles, isElevatorBlockBelow } from "../Actions";

world.beforeEvents.worldInitialize.subscribe((worldInitializeEvent: WorldInitializeBeforeEvent): void => {
	const { blockComponentRegistry } = worldInitializeEvent;

	blockComponentRegistry.registerCustomComponent(ElevatorsBlockCustomComponents.teleport, {
		onStepOn: (stepOnEvent: BlockComponentStepOnEvent): void => {
			const { entity: player, dimension, block } = stepOnEvent;

			if (!(player instanceof Player)) return;

			startElevatorTeleport(player, dimension, block);
		},
		onStepOff: (stepOffEvent: BlockComponentStepOffEvent): void => {
			const { entity: player } = stepOffEvent;

			if (!(player instanceof Player)) return;

			stopElevatorTeleport(player);
		},
		onTick: (tickEvent: BlockComponentTickEvent): void => {
			const { block, dimension } = tickEvent;

			tickElevatorParticles(block.location, dimension);
		},
	});
});

world.afterEvents.worldInitialize.subscribe((): void => {
	for (const player of world.getAllPlayers()) {
		const runId: number | undefined = player.getDynamicProperty(ElevatorsDynamicProperties.teleportSystemRunId) as number | undefined;

		if (runId) {
			const { dimension: playerDimension } = player;

			player.setDynamicProperty(ElevatorsDynamicProperties.teleportSystemRunId, undefined);

			const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

			if (!elevatorBlock) continue;

			startElevatorTeleport(player, playerDimension, elevatorBlock);
		}
	}
});
