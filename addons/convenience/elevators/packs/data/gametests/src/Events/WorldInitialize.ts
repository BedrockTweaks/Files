import { world, Player, Block, WorldInitializeBeforeEvent, BlockComponentStepOnEvent, BlockComponentStepOffEvent, BlockComponentPlayerDestroyEvent, BlockComponentTickEvent } from "@minecraft/server";
import { ElevatorsBlockCustomComponentIdentifiers, ElevatorsDynamicProperties } from "../Models";
import { startElevatorTeleport, stopElevatorTeleport, tickElevatorParticles, isElevatorBlockBelow } from "../Actions";

world.beforeEvents.worldInitialize.subscribe((worldInitializeEvent: WorldInitializeBeforeEvent): void => {
	const { blockComponentRegistry } = worldInitializeEvent;

	blockComponentRegistry.registerCustomComponent(ElevatorsBlockCustomComponentIdentifiers.teleport, {
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
		onPlayerDestroy: (playerDestroyEvent: BlockComponentPlayerDestroyEvent): void => {
			// If someone else broke the block other than the player standing, then the player's elevator teleport will end when their cooldown ends
			const { player } = playerDestroyEvent;

			if (!player) return;

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
