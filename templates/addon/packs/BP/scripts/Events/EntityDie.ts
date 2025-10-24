import { EntityDieAfterEvent, world } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';

/**
 * We check for conditions in the Event Handlers and run the Actions related to them if the conditions are met
 * Prefer casting here after the type was checked rather than in Actions
 */
world.afterEvents.entityDie.subscribe(({ deadEntity }: EntityDieAfterEvent): void => {
	if (deadEntity.matches({ type: MinecraftEntityTypes.Player })) {
		// Action to run when a player dies
		// exampleAction(deadEntity as Player);
	}
});
