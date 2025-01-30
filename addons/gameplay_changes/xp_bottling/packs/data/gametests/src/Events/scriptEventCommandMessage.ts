import {
	system,
	ScriptEventCommandMessageAfterEvent,
	Player
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { uninstall, clearPlayer } from '../Actions';
import { XpBottlingScriptEvents } from '../Models';
import { openConfigInterface } from '../UI';

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
