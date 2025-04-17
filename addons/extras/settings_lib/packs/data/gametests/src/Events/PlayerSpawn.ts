import { world, EntityComponentTypes, ItemStack, PlayerSpawnAfterEvent, EntityInventoryComponent } from '@minecraft/server';
import { SettingsLibDynamicProperties, SettingsLibItemTypes } from '../Models';

/**
 * In this event, we listen to player joining the world and checking if they have
 * already received the settings book item, if not, then we will give them 1 settings book item and
 * setting a dynamic property to let the script know that they have finally received the item.
 */
world.afterEvents.playerSpawn.subscribe((playerSpawnEvent: PlayerSpawnAfterEvent): void => {
	if (!playerSpawnEvent.initialSpawn) return;

	const { player }: PlayerSpawnAfterEvent = playerSpawnEvent;

	if (!player.getDynamicProperty(SettingsLibDynamicProperties.settingsBookReceived)) {
		(player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent).container!.addItem(new ItemStack(SettingsLibItemTypes.settingsBook));

		player.setDynamicProperty(SettingsLibDynamicProperties.settingsBookReceived, true);
	}
});
