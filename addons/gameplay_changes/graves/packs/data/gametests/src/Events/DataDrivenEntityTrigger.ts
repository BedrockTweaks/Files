import {
	DataDrivenEntityTriggerAfterEvent,
	world
} from '@minecraft/server';
import { forceOpenGrave } from '../Functions';
import { GraveEntityEvents, GravesEntityTypes } from '../Models';

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }: DataDrivenEntityTriggerAfterEvent): void => {
	if (entity.typeId === GravesEntityTypes.Grave && eventId === GraveEntityEvents.DropItems) {
		forceOpenGrave(entity);
	}
});
