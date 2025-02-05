import {
	system,
	ScriptEventCommandMessageAfterEvent
} from '@minecraft/server';
import { uninstall } from '../Actions';
import { AntiGhastGriefScriptEvents } from '../Models';

system.afterEvents.scriptEventReceive.subscribe(({ id }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		// // case AntiGhastGriefScriptEvents.config:
		// // if (sourceEntity?.matches({ type: MinecraftEntityTypes.Player })) {
		// // 		openConfigInterface(sourceEntity as Player);
		// // 	}
		// // 	break;

		case AntiGhastGriefScriptEvents.uninstall:
			uninstall();
			break;

		default:
			break;
	}
});
