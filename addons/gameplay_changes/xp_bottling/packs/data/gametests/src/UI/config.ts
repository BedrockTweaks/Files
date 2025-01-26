import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { openSettingsInterface } from './globalSettings';

export const openConfigInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.xb.config.title' })
		.button({ translate: 'bt.xb.config.global_settings' });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				openSettingsInterface(player);
				break;

			default:
				break;
		}
	});
};
