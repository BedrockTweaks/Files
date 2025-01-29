import { world, ExplosionBeforeEvent } from '@minecraft/server';
import { ElevatorBlockTypes } from '../Models';
import { deleteElevatorBlockSettings } from '../Actions';

world.beforeEvents.explosion.subscribe((explosionEvent: ExplosionBeforeEvent): void => {
	for (const block of explosionEvent.getImpactedBlocks()) {
		if (ElevatorBlockTypes.includes(block.typeId)) {
			deleteElevatorBlockSettings(block);
		}
	}
});
