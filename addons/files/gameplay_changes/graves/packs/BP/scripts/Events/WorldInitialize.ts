import { world } from '@minecraft/server';
import { initializeSettings } from '../Actions';

world.afterEvents.worldInitialize.subscribe((): void => {
	initializeSettings();
});
