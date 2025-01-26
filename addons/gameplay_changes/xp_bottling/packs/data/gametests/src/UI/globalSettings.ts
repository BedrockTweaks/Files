import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { XpBottlingSettings } from '../Models';
import { getSettings, setSettings } from '../Actions';
import { openConfigInterface } from './config';

export const openSettingsInterface = (player: Player): void => {
	const xpBottlingSettings: XpBottlingSettings = getSettings();

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.settings.title' })
		.textField({ translate: 'bt.xb.settings.amount_of_xp', with: ['\n'] }, { translate: 'bt.xb.settings.default_amount_of_xp' })
		.textField({ translate: '' }, { translate: '' })
		.toggle({ translate: '' })
		.toggle({ translate: '' })

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// toggle = boolean
			// slider = number
			// textField = string
			const formValues: [number, number, boolean, boolean] = response.formValues as [number, number, boolean, boolean];

			xpBottlingSettings.amountOfXp = formValues[0];
			xpBottlingSettings.timeToUse = formValues[1];
			xpBottlingSettings.enableStackConsume = formValues[2];
			xpBottlingSettings.enableStackCrafting = formValues[3];
		}

		if (!response.canceled) {
			setSettings(xpBottlingSettings);

			openConfigInterface(player);
		}
	});
};
