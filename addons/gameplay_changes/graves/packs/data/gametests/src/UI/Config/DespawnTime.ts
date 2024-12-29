import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse, ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { openConfigInterface } from '.';
import { getSettings, setSettings } from '../../Functions';
import { GravesSettings } from '../../Models';

export const openDespawnTimeInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form = new ActionFormData()
		.title({ translate: 'bt.graves.settings.despawn_time' })
		.body({ translate: 'bt.graves.settings.despawn_time.description', with: ['\n', ' ' + gravesSettings.despawnTime] })
		.button({ translate: 'bt.graves.settings.edit' });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				openDespawnTimeEditInterface(player);

				break;
			default:
				break;
		}

		if (response.canceled) {
			openConfigInterface(player);
		}
	});
};

const openDespawnTimeEditInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form = new ModalFormData()
		.title({ translate: 'bt.graves.settings.despawn_time' })
		.textField({ translate: 'bt.graves.settings.despawn_time.edit', with: ['\n'] }, '', gravesSettings.despawnTime + '');

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues?.[0]) {
			const value = parseInt(response.formValues[0] + '');

			if (!Number.isNaN(value)) {
				gravesSettings.despawnTime = value;

				setSettings(gravesSettings);
				openConfigInterface(player);
			} else {
				sendErrorMessage(player);
			}
		} else {
			sendErrorMessage(player);
		}
	});
};

const sendErrorMessage = (player: Player): void => {
	player.sendMessage({ translate: 'bt.graves.settings.despawn_time.error' });
};
