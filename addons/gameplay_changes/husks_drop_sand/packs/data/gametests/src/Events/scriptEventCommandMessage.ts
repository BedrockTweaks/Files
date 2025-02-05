import {
	system,
	ScriptEventCommandMessageAfterEvent,
	Player
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { uninstall } from '../Actions';
import { HusksDropSandScriptEvents } from '../Models';
import { openSettingsInterface } from '../UI';

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		case HusksDropSandScriptEvents.config:
			if (sourceEntity?.matches({ type: MinecraftEntityTypes.Player })) {
				void openSettingsInterface(sourceEntity as Player);
			}
			break;

		case HusksDropSandScriptEvents.uninstall:
			void uninstall();
			break;

		default:
			break;
	}
});
