import {
	EntityDieAfterEvent,
	Player,
	world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { spawnGrave } from '../Functions';

world.afterEvents.entityDie.subscribe(({ deadEntity }: EntityDieAfterEvent): void => {
	if (deadEntity.typeId === MinecraftEntityTypes.Player) {
		spawnGrave(deadEntity as Player);
	}
});
