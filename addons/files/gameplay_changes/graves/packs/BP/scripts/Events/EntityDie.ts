import {
	EntityDieAfterEvent,
	Player,
	world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { spawnGrave } from '../Actions';

world.afterEvents.entityDie.subscribe(({ deadEntity }: EntityDieAfterEvent): void => {
	if (deadEntity.matches({ type: MinecraftEntityTypes.Player })) {
		spawnGrave(deadEntity as Player);
	}
});
