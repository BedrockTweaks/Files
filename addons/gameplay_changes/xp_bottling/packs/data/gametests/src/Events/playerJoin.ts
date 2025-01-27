import { PlayerSpawnAfterEvent, world } from '@minecraft/server';
import { initializePlayerSettings } from '../Actions';

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }: PlayerSpawnAfterEvent): void => {
	if (!initialSpawn) return;
	initializePlayerSettings(player);
});
