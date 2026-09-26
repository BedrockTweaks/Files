import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { giveGraveKey, listAllGraves } from '../Actions';
import { openSettingsInterface } from './Settings';

export const openConfigInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.graves.config.title' })
		.button({ translate: 'bt.graves.config.change_settings' })
		.button({ translate: 'bt.graves.config.list_all_graves' })
		.button({ translate: 'bt.graves.config.receive_grave_key' });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				openSettingsInterface(player);

				break;
			case 1:
				listAllGraves(player);

				break;
			case 2:
				giveGraveKey(player);

				break;
			default:
				break;
		}
	});
};
