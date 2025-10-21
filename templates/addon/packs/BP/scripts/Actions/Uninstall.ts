import { world } from '@minecraft/server';

export const uninstall = (): void => {
	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.example.misc.uninstall', with: ['\n'] });
};
