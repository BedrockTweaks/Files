import { world, EntityInitializationCause, EntityComponentTypes, ItemStack, EntitySpawnAfterEvent, EntityItemComponent } from '@minecraft/server';
import { DirtVariantBlockTypes } from '../Models';
import { convertToMud } from '../Actions';

/**
 * In this event, we will first check if the entity spawn cause is "Spawned" entity initialization cause
 * and then we will check if the entity is a dropped item,
 * if it is, then we will check if it is a dirt variant block
 * and if it is, then we will execute convert to mud function on the dropped item.
 */
world.afterEvents.entitySpawn.subscribe((entitySpawnEvent: EntitySpawnAfterEvent): void => {
	if (entitySpawnEvent.cause !== EntityInitializationCause.Spawned) return;

	const { entity } = entitySpawnEvent;

	if (!entity.hasComponent(EntityComponentTypes.Item)) return;

	const item: ItemStack = (entity.getComponent(EntityComponentTypes.Item) as EntityItemComponent).itemStack;

	if (DirtVariantBlockTypes.includes(item.typeId)) {
		convertToMud(entity, item);
	}
});
