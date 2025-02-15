import { world, EntityInitializationCause, EntityComponentTypes, ItemStack, EntitySpawnAfterEvent, EntityItemComponent } from '@minecraft/server';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { woolToElevator } from '../Actions';

/**
 * In this event, we listen to the ender pearl item being spawned as a dropped item
 * and then we will start the wool to elevator process in which
 * the function will check if the ender pearl item is dropped on top of a wool block,
 * if it is, then convert the wool block to an elevator block.
 */
world.afterEvents.entitySpawn.subscribe((entitySpawnEvent: EntitySpawnAfterEvent): void => {
	if (entitySpawnEvent.cause !== EntityInitializationCause.Spawned) return;

	const { entity }: EntitySpawnAfterEvent = entitySpawnEvent;

	if (!entity.hasComponent(EntityComponentTypes.Item)) return;

	const item: ItemStack = (entity.getComponent(EntityComponentTypes.Item) as EntityItemComponent).itemStack;

	if (item.typeId === MinecraftItemTypes.EnderPearl) {
		woolToElevator(entity);
	}
});
