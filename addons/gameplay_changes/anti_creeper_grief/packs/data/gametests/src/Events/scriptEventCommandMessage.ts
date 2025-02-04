import {
	system,
	Player,
	ScriptEventCommandMessageAfterEvent
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { uninstall } from '../Actions';
import { AntiCreeperGriefScriptEvents } from '../Models';
import { openConfigInterface } from '../UI';

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		case AntiCreeperGriefScriptEvents.config:
			if (sourceEntity?.matches({ type: MinecraftEntityTypes.Player })) {
				openConfigInterface(sourceEntity as Player);
			}
			break;

		case AntiCreeperGriefScriptEvents.uninstall:
			uninstall();
			break;

		default:
			break;
	}
});
