import {
	Player,
	ScriptEventCommandMessageAfterEvent,
	system
} from '@minecraft/server';
import { uninstall } from '../Actions';
import { XpBottlingScriptEvents } from '../Models';
import { openConfigInterface } from '../UI';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		case XpBottlingScriptEvents.config:
			if (sourceEntity?.matches({ type: MinecraftEntityTypes.Player })) {
				openConfigInterface(sourceEntity as Player);
			}
			break;

		case XpBottlingScriptEvents.uninstall:
			uninstall();
			break;

		default:
			break;
	}
});
