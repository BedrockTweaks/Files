import { world, PlayerSpawnAfterEvent } from '@minecraft/server';
import { getPlayerSettings, initializePlayerSettings } from '../Actions';
import { PlayerXpBottlingSettings } from '../Models';

world.afterEvents.playerSpawn.subscribe(({ player }: PlayerSpawnAfterEvent): void => {
	const { initialized }: PlayerXpBottlingSettings = getPlayerSettings(player);
	if (initialized) return;
	void initializePlayerSettings(player);
});
