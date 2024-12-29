import {
	EntityHitEntityAfterEvent,
	Player,
	world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { openGrave } from '../Functions';
import { GravesEntityTypes } from '../Models';

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }: EntityHitEntityAfterEvent): void => {
	if (
		damagingEntity.typeId === MinecraftEntityTypes.Player &&
		hitEntity.typeId === GravesEntityTypes.Grave
	) {
		openGrave(damagingEntity as Player, hitEntity);
	}
});
