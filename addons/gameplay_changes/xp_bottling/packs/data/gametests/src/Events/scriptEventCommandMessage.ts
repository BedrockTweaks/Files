import {
	system,
	ScriptEventCommandMessageAfterEvent,
	Player
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { uninstall, clearPlayer } from '../Actions';
import { XpBottlingScriptEvents } from '../Models';
import { openConfigInterface } from '../UI';

/**
 * * scriptEventReceive Event listeners
 * In this event we listen for when the addon sends us a "ScriptEvent"
 * this allows us to connect front end /functions to backend scripting and further
 * lets us react to those function commands to do things like opening a config or
 * removing dynamicProperties which cannot be done from anywhere except scripting
*/

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity, message }: ScriptEventCommandMessageAfterEvent): void => {
	switch (id) {
		case XpBottlingScriptEvents.config:
			if (sourceEntity?.matches({ type: MinecraftEntityTypes.Player })) {
				void openConfigInterface(sourceEntity as Player);
			}
			break;

		case XpBottlingScriptEvents.uninstall:
			void uninstall();
			break;

		case XpBottlingScriptEvents.clearPlayer:
			void clearPlayer(message);
			break;

		default:
			break;
	}
});
