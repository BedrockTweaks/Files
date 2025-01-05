import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { getSettings, setSettings } from '../../Actions';
import { GravesSettings } from '../../Models';
import { openConfigInterface } from '.';

export const openGraveLocatingInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.graves.settings.grave_locating' })
		.body({
			rawtext: [
				{ translate: 'bt.graves.settings.grave_locating.description', with: ['\n', ' '] },
				{ translate: `bt.graves.settings.${gravesSettings.graveLocating ? 'enabled' : 'disabled'}` },
			],
		})
		.button({ translate: `bt.graves.settings.${!gravesSettings.graveLocating ? 'enable' : 'disable'}` });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				gravesSettings.graveLocating = !gravesSettings.graveLocating;

				break;
			default:
				break;
		}

		if (!response.canceled) {
			setSettings(gravesSettings);
		}

		openConfigInterface(player);
	});
};
