import { world, PlayerSpawnAfterEvent } from '@minecraft/server';
import { initializePlayerSettings } from '../Actions';

/**
 * * playerSpawn Event listeners
 * In this event we listen for any player joining the world or rejoining the world
 * and initialize their settings used in the addon for a seemless first time
 * experience
*/

world.afterEvents.playerSpawn.subscribe(({ player }: PlayerSpawnAfterEvent): void => {
	void initializePlayerSettings(player);
});
