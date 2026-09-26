import { world } from '@minecraft/server';
import { getSettings } from './settings';
import { GravesSettings } from '../Models';

/**
 * Uninstalls the grave addon by restoring game rules and clearing dynamic properties.
 */
export const uninstall = (): void => {
	const settings: GravesSettings = getSettings();

	world.gameRules.keepInventory = settings.keepInventory;

	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.graves.uninstall' });
};
