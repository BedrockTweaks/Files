import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { openSettingsInterface, openPlayerSettingsInterface, openResetPlayerInterface } from '../UI';

export const openConfigInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.xb.config.title' })
		.button({ translate: 'bt.xb.config.globalSettings' })
		.button({ translate: 'bt.xb.config.playerSettings' })
		.button({ translate: 'bt.xb.config.resetPlayer' });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				openSettingsInterface(player);
				break;

			case 1:
				openPlayerSettingsInterface(player);
				break;

			case 2:
				openResetPlayerInterface(player);
				break;

			default:
				break;
		}
	});
};
