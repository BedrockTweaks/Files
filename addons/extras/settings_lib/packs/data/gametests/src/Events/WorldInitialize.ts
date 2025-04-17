import { world, WorldInitializeBeforeEvent, ItemComponentUseEvent } from '@minecraft/server';
import { SettingsLibItemCustomComponents } from '../Models';
import { openSettingsInterface } from '../UI';

/**
 * In this event, we register all the custom components for the settings book item.
 */
world.beforeEvents.worldInitialize.subscribe((worldInitializeEvent: WorldInitializeBeforeEvent): void => {
	const { itemComponentRegistry }: WorldInitializeBeforeEvent = worldInitializeEvent;

	itemComponentRegistry.registerCustomComponent(SettingsLibItemCustomComponents.settingsBook, {
		/**
		 * In this custom component, we listen to the item being used and if it is being used,
		 * then we will open the settings UI for the player who is using the settings book item.
		 */
		onUse: (onUseEvent: ItemComponentUseEvent): void => {
			const { source: player }: ItemComponentUseEvent = onUseEvent;

			openSettingsInterface(player);
		},
	});
});
