import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { getSettings, setSettings } from '../../Functions';
import { GravesSettings } from '../../Models';
import { openConfigInterface } from '.';

export const openXPCollectionInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form = new ActionFormData()
		.title({ translate: 'bt.graves.settings.xp_collection' })
		.body({
			rawtext: [
				{ translate: 'bt.graves.settings.xp_collection.description', with: ['\n', ' '] },
				{ translate: `bt.graves.settings.${gravesSettings.xpCollection ? 'enabled' : 'disabled'}` }
			]
		})
		.button({ translate: `bt.graves.settings.${!gravesSettings.xpCollection ? 'enable' : 'disable'}` });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				gravesSettings.xpCollection = !gravesSettings.xpCollection;

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
