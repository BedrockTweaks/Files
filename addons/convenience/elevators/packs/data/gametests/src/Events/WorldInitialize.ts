import { world, Player, EntityComponentTypes, Block, WorldInitializeBeforeEvent, BlockComponentStepOnEvent, BlockComponentStepOffEvent, BlockComponentTickEvent, BlockComponentOnPlaceEvent, BlockComponentPlayerInteractEvent, EntityInventoryComponent } from "@minecraft/server";
import { ElevatorsBlockCustomComponents, ElevatorsBlockIndividualSettingsIds, Elevators, ElevatorsDynamicProperties } from "../Models";
import { getElevatorBlockSettings, startElevatorTeleport, stopElevatorTeleport, tickElevatorParticles, initializeElevatorBlockSettings, initializeSettings, initializeBlocksSettings, updateConfig, isElevatorBlockBelow } from "../Actions";
import { openBlockSettings } from "../UI";
import { getProperties, setProperties } from "../Util";

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

			if (!getElevatorBlockSettings(block)?.[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]) return;

			tickElevatorParticles(block.location, dimension);
		},
		onPlace: (placeEvent: BlockComponentOnPlaceEvent): void => {
			const { block } = placeEvent;

			initializeElevatorBlockSettings(block);
		},
		onPlayerInteract: (playerInteractEvent: BlockComponentPlayerInteractEvent): void => {
			const { block, player } = playerInteractEvent;

			if (!player) return;

			if ((player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent).container!.getItem(player.selectedSlotIndex)) return;

			openBlockSettings(player, block);
		},
	});
});

world.afterEvents.worldInitialize.subscribe((): void => {
	initializeSettings();
	initializeBlocksSettings();
	updateConfig();

	for (const player of world.getAllPlayers()) {
		const runId: number | undefined = getProperties<Elevators>(player, ElevatorsDynamicProperties).teleportSystemRunId;

		if (runId) {
			const { dimension: playerDimension } = player;

			setProperties(player, ElevatorsDynamicProperties, { teleportSystemRunId: undefined } as Elevators);

			const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

			if (!elevatorBlock) continue;

			startElevatorTeleport(player, playerDimension, elevatorBlock);
		}
	}
});
