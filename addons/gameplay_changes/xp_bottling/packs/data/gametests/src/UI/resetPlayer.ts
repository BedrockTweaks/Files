import { world, Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { openConfigInterface } from '../UI';
import { initializePlayerSettings } from '../Actions';

export const openResetPlayerInterface = async(admin: Player): Promise<void> => {
	const onlinePlayers = world.getAllPlayers();
	const playerList = [];
	for (const player of onlinePlayers) {
		playerList.push(player.name);
	}

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.util.title' })
		.dropdown({ translate: 'bt.xb.util.dropdown', with: ['\n'] }, playerList, playerList.indexOf(admin.name));

	const response: ModalFormResponse = await form.show(admin);
	if (response.canceled) {
		void openConfigInterface(admin);
	} else {
		if (!response.formValues) return;
		const playerIndex = response.formValues[0] as number;
		const player = world.getPlayers({ name: playerList[playerIndex] })[0];
		void player.clearDynamicProperties();
		void player.sendMessage({ translate: 'bt.xb.misc.clearPlayer', with: ['\n', player.name] });
		void initializePlayerSettings(player);
	}
};
