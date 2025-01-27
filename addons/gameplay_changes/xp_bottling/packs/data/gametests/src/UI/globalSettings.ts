import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { XpBottlingSettings } from '../Models';
import { getSettings, setSettings } from '../Actions';
import { openConfigInterface } from './config';

export const openSettingsInterface = (player: Player): void => {
	const xpBottlingSettings: XpBottlingSettings = getSettings();

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.settings.title' })
		.slider({ translate: 'bt.xb.settings.amount_of_xp', with: ['\n'] }, 1, 100, 1, 23)
		.toggle({ translate: 'bt.xb.settings.instant_use', with: ['\n'] })
		.slider({ translate: 'bt.xb.settings.time_to_use', with: ['\n'] }, 1, 100, 1, 20) // divide by 10 in use, otherwise way too long
		.toggle({ translate: 'bt.xb.settings.enable_stack_consume', with: ['\n'] })
		.toggle({ translate: 'bt.xb.settings.enable_stack_craft', with: ['\n'] });

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// toggle = boolean
			// slider = number
			// textField = string
			const formValues: [number, boolean, number, boolean, boolean] = response.formValues as [number, boolean, number, boolean, boolean];

			xpBottlingSettings.amountOfXp = formValues[0];
			xpBottlingSettings.instantUse = formValues[1];
			xpBottlingSettings.timeToUse = formValues[2];
			xpBottlingSettings.enableStackConsume = formValues[3];
			xpBottlingSettings.enableStackCrafting = formValues[4];
		}

		if (!response.canceled) {
			setSettings(xpBottlingSettings);

			openConfigInterface(player);
		}
	});
};
