import {
	world,
	WorldInitializeBeforeEvent,
	ItemComponentUseEvent
} from '@minecraft/server';
import { initializeSettings } from '../Actions';
import { XpBottlingCustomComponents } from '../Models';
import { openPlayerSettingsInterface } from '../UI';

/**
 * * worldInitialize Event listeners
 * In this event we listen for when the world has given the script engine the
 * greenlight to go ahead and start processing and setting up the environment.
 *
 * Before the world has loaded, we must register any custom components used by any
 * custom item in this addon, done below.
 *
 * After the world has loaded we initialize any addon settings for a seemless
 * user experience (should only run once or after a /function {addon}/uninstall)
*/

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }: WorldInitializeBeforeEvent): void => {
	itemComponentRegistry.registerCustomComponent(XpBottlingCustomComponents.guideBook, {
		onUse: ({ source }: ItemComponentUseEvent): void => {
			openPlayerSettingsInterface(source);
		},
	});
});

world.afterEvents.worldInitialize.subscribe((): void => {
	void initializeSettings();
});
