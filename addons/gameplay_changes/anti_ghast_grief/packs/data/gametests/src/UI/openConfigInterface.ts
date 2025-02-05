import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { AntiGhastGriefSettings } from '../Models';
import { getSettings, setSettings } from '../Actions';

export const openConfigInterface = (player: Player): void => {
	const AntiGhastGriefSettings: AntiGhastGriefSettings = getSettings();
	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.acg.config.title' })
		.toggle({ translate: 'bt.acg.config.ghastsDoDamage', with: ['\n'] }, AntiGhastGriefSettings.ghastsDoDamage);

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			const formValues: [boolean] = response.formValues as [boolean];

			AntiGhastGriefSettings.ghastsDoDamage = formValues[0];
		}

		if (!response.canceled) {
			setSettings(AntiGhastGriefSettings);

			// // openConfigInterface(player);
		}
	});
};
