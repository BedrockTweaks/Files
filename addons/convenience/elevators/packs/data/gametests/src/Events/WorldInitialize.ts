import { world, Player, EntityComponentTypes, Block, WorldInitializeBeforeEvent, BlockComponentStepOnEvent, BlockComponentStepOffEvent, BlockComponentTickEvent, BlockComponentOnPlaceEvent, BlockComponentPlayerInteractEvent, EntityInventoryComponent } from '@minecraft/server';
import { ElevatorsBlockCustomComponents, ElevatorsBlockIndividualSettingsIds, Elevators, ElevatorsDynamicProperties } from '../Models';
import { getElevatorBlockSettings, startElevatorTeleport, stopElevatorTeleport, tickElevatorParticles, initializeElevatorBlockSettings, initializeSettings, initializeBlocksSettings, updateConfig, getSettings, isElevatorBlockBelow } from '../Actions';
import { openBlockSettings } from '../UI';
import { getProperties, setProperties } from '../Util';
import { itemUseOnEventSubscription } from './ItemUseOn';

world.beforeEvents.worldInitialize.subscribe((worldInitializeEvent: WorldInitializeBeforeEvent): void => {
	const { blockComponentRegistry }: WorldInitializeBeforeEvent = worldInitializeEvent;

	blockComponentRegistry.registerCustomComponent(ElevatorsBlockCustomComponents.teleport, {
		onStepOn: (stepOnEvent: BlockComponentStepOnEvent): void => {
			const { entity: player, dimension, block }: BlockComponentStepOnEvent = stepOnEvent;

			if (!(player instanceof Player)) return;

			startElevatorTeleport(player, dimension, block);
		},
		onStepOff: (stepOffEvent: BlockComponentStepOffEvent): void => {
			const { entity: player }: BlockComponentStepOffEvent = stepOffEvent;

			if (!(player instanceof Player)) return;

			stopElevatorTeleport(player);
		},
		onTick: (tickEvent: BlockComponentTickEvent): void => {
			const { block, dimension }: BlockComponentTickEvent = tickEvent;

			if (!getElevatorBlockSettings(block)?.[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]) return;

			tickElevatorParticles(block.location, dimension);
		},
		onPlace: (placeEvent: BlockComponentOnPlaceEvent): void => {
			const { block }: BlockComponentOnPlaceEvent = placeEvent;

			initializeElevatorBlockSettings(block);
		},
		onPlayerInteract: (playerInteractEvent: BlockComponentPlayerInteractEvent): void => {
			const { block, player }: BlockComponentPlayerInteractEvent = playerInteractEvent;

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

	if (!getSettings().camouflage) {
		world.beforeEvents.itemUseOn.unsubscribe(itemUseOnEventSubscription);
	}

	for (const player of world.getAllPlayers()) {
		const runId: number | undefined = getProperties<Elevators>(player, ElevatorsDynamicProperties).teleportSystemRunId;

		if (runId) {
			const { dimension: playerDimension }: Player = player;

			setProperties(player, ElevatorsDynamicProperties, { teleportSystemRunId: undefined } as Elevators);

			const elevatorBlock: Block | undefined = isElevatorBlockBelow(playerDimension, player.location);

			if (!elevatorBlock) continue;

			startElevatorTeleport(player, playerDimension, elevatorBlock);
		}
	}
});
