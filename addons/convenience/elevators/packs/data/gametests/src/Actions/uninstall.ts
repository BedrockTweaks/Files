import { world } from '@minecraft/server';

/**
 * @name uninstall
 * @remarks Uninstalls the elevators addon by clearing all its dynamic properties.
 */
export const uninstall = (): void => {
	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.elevators.uninstall' });
};
