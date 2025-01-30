import { world, EntityInitializationCause, EntityComponentTypes, ItemStack, EntitySpawnAfterEvent, EntityItemComponent } from '@minecraft/server';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { woolToElevator } from '../Actions';

world.afterEvents.entitySpawn.subscribe((entitySpawnEvent: EntitySpawnAfterEvent): void => {
	if (entitySpawnEvent.cause !== EntityInitializationCause.Spawned) return;

	const { entity } = entitySpawnEvent;

	if (!entity.hasComponent(EntityComponentTypes.Item)) return;

	const item: ItemStack = (entity.getComponent(EntityComponentTypes.Item) as EntityItemComponent).itemStack;

	if (item.typeId === MinecraftItemTypes.EnderPearl) {
		woolToElevator(entity);
	}
});
