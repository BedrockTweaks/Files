import { system, Player, ScriptEventCommandMessageAfterEvent } from '@minecraft/server';
import { ElevatorsScriptEvents } from '../Models';
import { uninstall } from '../Actions';
import { openConfigInterface } from '../UI';

/**
 * In this event, we listen to all the script events being received, and if the received script event
 * is either the elevator config or the elevator uninstall, then we will open the config interface for the player if it is elevator config script event
 * or we will uninstall the addon if it is elevator uninstall script event.
 */
system.afterEvents.scriptEventReceive.subscribe((scriptEventReceiveEvent: ScriptEventCommandMessageAfterEvent): void => {
	const { sourceEntity }: ScriptEventCommandMessageAfterEvent = scriptEventReceiveEvent;

	switch (scriptEventReceiveEvent.id) {
		case ElevatorsScriptEvents.config:
			if (sourceEntity instanceof Player) {
				openConfigInterface(sourceEntity);
			}

			break;
		case ElevatorsScriptEvents.uninstall:
			uninstall();

			break;
	}
});
