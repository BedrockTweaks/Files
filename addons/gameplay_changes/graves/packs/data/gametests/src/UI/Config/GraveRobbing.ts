import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { getSettings, setSettings } from '../../Functions';
import { GravesSettings } from '../../Models';
import { openConfigInterface } from '.';

export const openGraveRobbingInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form = new ActionFormData()
		.title({ translate: 'bt.graves.settings.grave_robbing' })
		.body({
			rawtext: [
				{ translate: 'bt.graves.settings.grave_robbing.description', with: ['\n', ' '] },
				{ translate: `bt.graves.settings.${gravesSettings.graveRobbing ? 'enabled' : 'disabled'}` },
			],
		})
		.button({ translate: `bt.graves.settings.${!gravesSettings.graveRobbing ? 'enable' : 'disable'}` });

	form.show(player).then((response: ActionFormResponse): void => {
		switch (response.selection) {
			case 0:
				gravesSettings.graveRobbing = !gravesSettings.graveRobbing;

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
