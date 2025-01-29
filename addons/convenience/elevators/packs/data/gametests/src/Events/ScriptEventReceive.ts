import { system, Player, ScriptEventCommandMessageAfterEvent } from "@minecraft/server";
import { ElevatorsScriptEvents } from "../Models";
import { uninstall } from "../Actions";
import { openConfigInterface } from "../UI";

system.afterEvents.scriptEventReceive.subscribe((scriptEventReceiveEvent: ScriptEventCommandMessageAfterEvent): void => {
	const { sourceEntity } = scriptEventReceiveEvent;

	switch (scriptEventReceiveEvent.id) {
		case ElevatorsScriptEvents.config:
			if (sourceEntity instanceof Player) openConfigInterface(sourceEntity);

			break;
		case ElevatorsScriptEvents.uninstall:
			uninstall();

			break;
	}
});
