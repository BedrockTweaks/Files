import { world, Player, EntityDieAfterEvent } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { stopElevatorTeleport } from '../Actions';

world.afterEvents.entityDie.subscribe((entityDieEvent: EntityDieAfterEvent): void => {
	const { deadEntity: player }: EntityDieAfterEvent = entityDieEvent;

	stopElevatorTeleport(player as Player);
}, { entityTypes: [MinecraftEntityTypes.Player] });
