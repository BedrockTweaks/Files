import { world } from '@minecraft/server';

export const uninstall = (): void => {
	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.xb.uninstall' });
};
// TODO: figure out how to uninstall from offline players
