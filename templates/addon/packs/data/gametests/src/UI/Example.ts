import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';

export const openExampleInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.example.config.title' })
		.button({ translate: 'bt.example.config.button' });

	form.show(player).then((response: ActionFormResponse): void => {
		if (response.selection !== undefined && response.selection === 0) {
			// Action to run on button press
		}
	});
};
