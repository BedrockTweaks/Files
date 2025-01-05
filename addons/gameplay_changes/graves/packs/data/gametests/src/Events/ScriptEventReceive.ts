import {
	ScriptEventCommandMessageAfterEvent,
	system
} from '@minecraft/server';
import { uninstall } from '../Actions';
import { GravesScriptEvents } from '../Models';
import { openConfigInterface } from '../UI';

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		case GravesScriptEvents.config:
			openConfigInterface(sourceEntity);
			break;

		case GravesScriptEvents.uninstall:
			uninstall();
			break;

		default:
			break;
	}
});
