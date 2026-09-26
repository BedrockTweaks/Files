import {
	PlayerInteractWithEntityAfterEvent,
	world
} from '@minecraft/server';
import { forceOpenGrave } from '../Actions';
import { GravesEntityTypes, GravesItemTypes } from '../Models';

world.afterEvents.playerInteractWithEntity.subscribe(({ target, itemStack }: PlayerInteractWithEntityAfterEvent): void => {
	if (target.matches({ type: GravesEntityTypes.Grave }) && itemStack?.matches(GravesItemTypes.GraveKey)) {
		forceOpenGrave(target);
	}
});
