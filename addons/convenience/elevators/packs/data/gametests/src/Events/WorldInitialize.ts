import { world, Player, EntityComponentTypes, Block, WorldInitializeBeforeEvent, BlockComponentStepOnEvent, BlockComponentStepOffEvent, BlockComponentTickEvent, BlockComponentOnPlaceEvent, BlockComponentPlayerInteractEvent, EntityInventoryComponent } from '@minecraft/server';
import { ElevatorsBlockCustomComponents, ElevatorsBlockIndividualSettingsIds, Elevators, ElevatorsDynamicProperties } from '../Models';
import { getElevatorBlockSettings, startElevatorTeleport, stopElevatorTeleport, tickElevatorParticles, initializeElevatorBlockSettings, initializeSettings, initializeBlocksSettings, updateConfig, getSettings, isElevatorBlockBelow } from '../Actions';
import { openBlockSettingsInterface } from '../UI';
import { getProperties, setProperties } from '../Util';
import { itemUseOnEventSubscription } from './ItemUseOn';

/**
 * In this event, we register all the custom components for the elevator block.
 */
world.beforeEvents.worldInitialize.subscribe((worldInitializeEvent: WorldInitializeBeforeEvent): void => {
	const { blockComponentRegistry }: WorldInitializeBeforeEvent = worldInitializeEvent;

	blockComponentRegistry.registerCustomComponent(ElevatorsBlockCustomComponents.teleport, {
		/**
		 * In this custom component, we listen to the player stepping on top of the elevator block
		 * and starting the elevator teleport process for them.
		 */
		onStepOn: (stepOnEvent: BlockComponentStepOnEvent): void => {
			const { entity: player, dimension, block: elevatorBlock }: BlockComponentStepOnEvent = stepOnEvent;

			if (!(player instanceof Player)) return;

			startElevatorTeleport(player, dimension, elevatorBlock);
		},

		/**
		 * In this custom component, we listen to the player stepping off the elevator block
		 * and then we have to stop their elevator teleport process.
		 */
		onStepOff: (stepOffEvent: BlockComponentStepOffEvent): void => {
			const { entity: player }: BlockComponentStepOffEvent = stepOffEvent;

			if (!(player instanceof Player)) return;

			stopElevatorTeleport(player);
		},

		/**
		 * In this custom component, we listen to every time the elevator block ticks,
		 * and if it ticks, then we spawn elevator particles on top of it.
		 */
		onTick: (tickEvent: BlockComponentTickEvent): void => {
			const { block, dimension }: BlockComponentTickEvent = tickEvent;

			if (!getElevatorBlockSettings(block)?.[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]) return;

			tickElevatorParticles(block.location, dimension);
		},

		/**
		 * In this custom component, we listen to player placing the elevator block
		 * and initializes the block settings for that placed elevator block.
		 */
		onPlace: (placeEvent: BlockComponentOnPlaceEvent): void => {
			const { block }: BlockComponentOnPlaceEvent = placeEvent;

			initializeElevatorBlockSettings(block);
		},

		/**
		 * In this custom component, we listen to every time a player interacts with the elevator block
		 * while having their main hand empty and opening the block settings UI for the player of this elevator block.
		 */
		onPlayerInteract: (playerInteractEvent: BlockComponentPlayerInteractEvent): void => {
			const { block, player }: BlockComponentPlayerInteractEvent = playerInteractEvent;

			if (!player) return;

			if ((player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent).container!.getItem(player.selectedSlotIndex)) return;

			openBlockSettingsInterface(player, block);
		},
	});
});

/**
 * In this event, we listen to every time the world initializes
 * and then we initialize all the settings and block settings if it isn't initialized yet
 * and update the config if there is an older config version being used.
 *
 * We also check if the camouflage is turned off, if it is, then we unsubscribe the itemUseOn event.
 *
 * We also check if the player whose has their teleport system run identifier from their dynamic properties are still standing on top of the elevator block,
 * if they are, then we clear their teleport system run identifier and starts a new elevator teleport process for them,
 * but if they are not, then we just clear their teleport system run identifier.
 */
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
