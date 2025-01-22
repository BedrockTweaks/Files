import {
	ItemCompleteUseAfterEvent,
	world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { XpBottlingsItemTypes } from '../Models';

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }: ItemCompleteUseAfterEvent) => {
	if (!source.matches({ type: MinecraftEntityTypes.Player })) return;
	if (!itemStack.matches(XpBottlingsItemTypes.XpBottle)) return;

	void source.dimension.runCommand(`title ${source.name} actionbar §r§o§6+16 XP§r`);
	void source.addExperience(16);
});
