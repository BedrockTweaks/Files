import { PlayerBreakBlockBeforeEvent, world } from '@minecraft/server';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';
import { dropItem } from '../Actions';
world.beforeEvents.playerBreakBlock.subscribe(({ block, itemStack }: PlayerBreakBlockBeforeEvent): void => {
	if (!itemStack) return;
	void dropItem(block, itemStack);
}, { blockTypes: [MinecraftBlockTypes.BuddingAmethyst] });
