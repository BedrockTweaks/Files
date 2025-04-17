import { system, ScriptEventSource, ScriptEventCommandMessageAfterEvent } from '@minecraft/server';
import { SettingsLibScriptEvents } from '../Models';
import { saveUIData, deleteUIData } from '../Actions';

/**
 * In this event, we listen to all the script events being received, and if the received script event
 * is either the send UI Data or remove UI Data, then we will save the UI Data if it is send UI Data script event
 * or we will delete the UI Data if it is remove UI Data script event.
 */
system.afterEvents.scriptEventReceive.subscribe((scriptEventReceiveEvent: ScriptEventCommandMessageAfterEvent): void => {
	const { id, sourceType, message }: ScriptEventCommandMessageAfterEvent = scriptEventReceiveEvent;

	if (sourceType === ScriptEventSource.Server) {
		switch (id) {
			case SettingsLibScriptEvents.sendUIData:
				saveUIData(message);

				break;
			case SettingsLibScriptEvents.removeUIData:
				deleteUIData(message);

				break;
		}
	}
});
