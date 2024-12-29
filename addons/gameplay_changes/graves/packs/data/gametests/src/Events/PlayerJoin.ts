import { world } from '@minecraft/server';
import { initializeSettings } from '../Functions';

world.afterEvents.playerJoin.subscribe((): void => {
	initializeSettings();
});
