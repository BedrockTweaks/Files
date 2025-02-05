import { world, ExplosionBeforeEvent } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { disableExplosion } from '../Actions';

world.beforeEvents.explosion.subscribe((explosionEvent: ExplosionBeforeEvent): void => {
	const { source }: ExplosionBeforeEvent = explosionEvent;
	if (!source?.matches({ type: MinecraftEntityTypes.Fireball })) return;
	void disableExplosion(explosionEvent);
});
