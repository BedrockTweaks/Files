import { world, Player } from '@minecraft/server';

export const uninstall = (): void => {
	world.clearDynamicProperties();
	world.sendMessage({ translate: 'bt.xb.misc.uninstall', with: ['\n'] });
};

// TODO: convert to dropdown UI with additional reset all button (with confirmation pop up)
export const clearPlayer = (message: string): void => {
	const player: Player = world.getPlayers({ name: message })[0];
	void player.sendMessage({ translate: 'bt.xb.misc.clearPlayer', with: ['\n', player.name] });
	void player.clearDynamicProperties();
};
