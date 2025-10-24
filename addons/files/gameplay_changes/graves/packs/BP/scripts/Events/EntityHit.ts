import {
	EntityHitEntityAfterEvent,
	Player,
	world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { openGrave } from '../Actions';
import { GravesEntityTypes } from '../Models';

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }: EntityHitEntityAfterEvent): void => {
	if (
		damagingEntity.matches({ type: MinecraftEntityTypes.Player }) &&
		hitEntity.matches({ type: GravesEntityTypes.Grave })
	) {
		openGrave(damagingEntity as Player, hitEntity);
	}
});
