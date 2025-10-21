import { world } from '@minecraft/server';
import { initializeSettings } from '../Actions';

world.afterEvents.worldLoad.subscribe((): void => {
	initializeSettings();
});
