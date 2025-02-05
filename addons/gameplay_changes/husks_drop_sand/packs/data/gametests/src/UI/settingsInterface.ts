import { Player } from '@minecraft/server';
import {
	ModalFormData,
	ModalFormResponse
} from '@minecraft/server-ui';
import { getSettings, setSettings } from '../Actions';
import { HusksDropSandSettings } from '../Models';

export const openSettingsInterface = (player: Player): void => {
	const currentSettings: HusksDropSandSettings = getSettings();
	let newSettings: HusksDropSandSettings = currentSettings;

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.hds.settings.title' })
		.toggle({ translate: 'bt.hds.settings.lootingEnabled', with: ['\n'] }, currentSettings.lootingEnabled)
		.slider({ translate: 'bt.hds.settings.sandMax', with: ['\n'] }, 1, 10, 1, currentSettings.sandMax)
		.slider({ translate: 'bt.hds.settings.sandMin', with: ['\n'] }, 1, 10, 1, currentSettings.sandMin);

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// toggle = boolean
			// slider = number
			// textField = string
			const formValues: [boolean, number, number] = response.formValues as [boolean, number, number];

			newSettings = {
				initialized: currentSettings.initialized,
				version: currentSettings.version,
				lootingEnabled: formValues[0],
				sandMax: formValues[1],
				sandMin: formValues[2],
			};
		}

		if (!response.canceled) {
			setSettings(newSettings);
		}
	});
};
