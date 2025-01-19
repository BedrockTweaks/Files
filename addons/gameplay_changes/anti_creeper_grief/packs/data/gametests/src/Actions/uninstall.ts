import { world } from '@minecraft/server';

/**
 * Uninstalls the grave addon by restoring game rules and clearing dynamic properties.
 */
export const uninstall = (): void => {
    world.clearDynamicProperties();
    world.sendMessage({ translate: 'bt.acg.uninstall' });
};
