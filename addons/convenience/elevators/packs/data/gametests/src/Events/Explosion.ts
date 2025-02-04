import { world, ExplosionBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { deleteElevatorBlockSettings } from '../Actions';

/**
 * In this event, we listen to all the blocks being destroy by an explosion
 * and if the block involved is an elevator block, then we will delete its
 * elevator block settings.
 */
world.beforeEvents.explosion.subscribe((explosionEvent: ExplosionBeforeEvent): void => {
	for (const block of explosionEvent.getImpactedBlocks()) {
		if (ElevatorBlockTypes.includes(block.typeId)) {
			deleteElevatorBlockSettings(block);
		}
	}
});
