import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { openSettingsInterface, openPlayerSettingsInterface } from '../UI';

export const openConfigInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.xb.config.title' })
		.button({ translate: 'bt.xb.config.globalSettings' })
		.button({ translate: 'bt.xb.config.playerSettings' });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				openSettingsInterface(player);
				break;

			case 1:
				openPlayerSettingsInterface(player);
				break;

			default:
				break;
		}
	});
};
