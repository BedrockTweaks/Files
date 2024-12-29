import { world } from '@minecraft/server';
import { getSettings } from './settings';

export const uninstall = (): void => {
	const settings = getSettings();

	world.gameRules.keepInventory = settings.keepInventory;

	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.graves.uninstall' });
};
