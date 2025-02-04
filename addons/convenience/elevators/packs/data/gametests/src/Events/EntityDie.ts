import { world, Player, EntityDieAfterEvent } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { stopElevatorTeleport } from '../Actions';

/**
 * In this event, we listen to player dying so that we will stop
 * the elevator teleport process for the player only if they have the elevator teleport system run identifier stored
 * in their dynamic properties.
 */
world.afterEvents.entityDie.subscribe((entityDieEvent: EntityDieAfterEvent): void => {
	const { deadEntity: player }: EntityDieAfterEvent = entityDieEvent;

	stopElevatorTeleport(player as Player);
}, { entityTypes: [MinecraftEntityTypes.Player] });
