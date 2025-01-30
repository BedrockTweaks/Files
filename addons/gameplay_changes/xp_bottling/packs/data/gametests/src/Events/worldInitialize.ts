import {
	world,
	WorldInitializeBeforeEvent,
	ItemComponentUseEvent
} from '@minecraft/server';
import { initializeSettings } from '../Actions';
import { XpBottlingCustomComponents } from '../Models';
import { openPlayerSettingsInterface } from '../UI';

world.afterEvents.worldInitialize.subscribe((): void => {
	void initializeSettings();
});

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }: WorldInitializeBeforeEvent): void => {
	itemComponentRegistry.registerCustomComponent(XpBottlingCustomComponents.guideBook, {
		onUse: ({ source }: ItemComponentUseEvent): void => {
			openPlayerSettingsInterface(source);
		},
	});
});
