import { Player } from '@minecraft/server';
import {
	ActionFormResponse,
	MessageFormData,
	ModalFormData,
	ModalFormResponse
} from '@minecraft/server-ui';
import { getSettings, setSettings } from '../Actions';
import { XpBottlingSettings } from '../Models';
import { openConfigInterface } from '../UI';

export const openSettingsInterface = (player: Player): void => {
	const currentSettings: XpBottlingSettings = getSettings();
	let newSettings: XpBottlingSettings = currentSettings;

	const settingsForm: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.settings.title' })
		.slider({ translate: 'bt.xb.settings.amountOfXp', with: ['\n'] }, 1, 40, 1, currentSettings.amountOfXp)
		.toggle({ translate: 'bt.xb.settings.instantUse', with: ['\n'] }, currentSettings.instantUse)
		.slider({ translate: 'bt.xb.settings.timeToUse', with: ['\n'] }, 4, 100, 4, currentSettings.timeToUse)
		.toggle({ translate: 'bt.xb.settings.enableStackConsume', with: ['\n'] }, currentSettings.enableStackConsume)
		.slider({ translate: 'bt.xb.settings.stackMultiplier', with: ['\n'] }, 1, 5, 1, currentSettings.stackMultiplier)
		.toggle({ translate: 'bt.xb.settings.enableStackCraft', with: ['\n'] }, currentSettings.enableStackCrafting);

	settingsForm.show(player).then((settingsResponse: ModalFormResponse): void => {
		if (settingsResponse.formValues) {
			// toggle = boolean
			// slider = number
			// textField = string
			const settingsFormValues: [number, boolean, number, boolean, number, boolean] = settingsResponse.formValues as [number, boolean, number, boolean, number, boolean];

			newSettings = {
				initialized: currentSettings.initialized,
				version: currentSettings.version,
				amountOfXp: settingsFormValues[0],
				instantUse: settingsFormValues[1],
				timeToUse: settingsFormValues[2],
				enableStackConsume: settingsFormValues[3],
				stackMultiplier: settingsFormValues[4],
				enableStackCrafting: settingsFormValues[5],
			};
		}

		/**
		 * TODO: split confirmation flow into seperate file
		 * note: consider what is accessbile in this scope and how to access within new context
		 *
		 * TODO: simplify if / else logic below
		 */
		const confirmForm: MessageFormData = new MessageFormData()
			.title({ translate: 'bt.xb.confirm.title' })
			.body({ translate: 'bt.xb.confirm.body', with: ['\n', currentSettings.amountOfXp.toString(), newSettings.amountOfXp.toString()] })
			.button1({ translate: 'bt.xb.confirm.no' })
			.button2({ translate: 'bt.xb.confirm.yes' });

		if (!settingsResponse.canceled) {
			if (newSettings.amountOfXp !== currentSettings.amountOfXp) {
				confirmForm.show(player).then((confirmResponse: ActionFormResponse): void => {
					if (confirmResponse.selection) {
						void setSettings(newSettings);
					} else {
						void openSettingsInterface(player);
					}
				});
			} else {
				void setSettings(newSettings);
			}
		} else {
			void openConfigInterface(player);
		}
	});
};
