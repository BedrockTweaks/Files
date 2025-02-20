import { Player } from '@minecraft/server';
import {
	MessageFormData,
	ModalFormData,
	ModalFormResponse
} from '@minecraft/server-ui';
import { getSettings, setSettings } from '../Actions';
import { XpBottlingSettings } from '../Models';
import { confirmationInterface, openConfigInterface } from '../UI';

export const openSettingsInterface = async(player: Player): Promise<void> => {
	const currentSettings: XpBottlingSettings = getSettings();
	let updatedSettings: XpBottlingSettings = Object.assign({}, currentSettings);

	const settingsForm: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.settings.title' })
		.slider({ translate: 'bt.xb.settings.amountOfXp', with: ['\n'] }, 1, 40, 1, currentSettings.amountOfXp)
		.toggle({ translate: 'bt.xb.settings.instantUse', with: ['\n'] }, currentSettings.instantUse)
		.slider({ translate: 'bt.xb.settings.timeToUse', with: ['\n'] }, 4, 100, 4, currentSettings.timeToUse)
		.toggle({ translate: 'bt.xb.settings.enableStackConsume', with: ['\n'] }, currentSettings.enableStackConsume)
		.slider({ translate: 'bt.xb.settings.stackMultiplier', with: ['\n'] }, 1, 5, 1, currentSettings.stackMultiplier)
		.toggle({ translate: 'bt.xb.settings.enableStackCraft', with: ['\n'] }, currentSettings.enableStackCrafting);

	const settingsResponse: ModalFormResponse = await settingsForm.show(player);
	if (settingsResponse.formValues) {
		// toggle = boolean
		// slider = number
		// textField = string
		const settingsFormValues: [number, boolean, number, boolean, number, boolean] = settingsResponse.formValues as [number, boolean, number, boolean, number, boolean];

		updatedSettings = {
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

	/*
		TODO: split confirmation flow into seperate file ✔️
		note: consider what is accessbile in this scope and how to access within new context

		TODO: simplify if / else logic below ✔️
	*/
	const confirmForm: MessageFormData = new MessageFormData()
		.title({ translate: 'bt.xb.confirm.title' })
		.body({ translate: 'bt.xb.confirm.body', with: ['\n', currentSettings.amountOfXp.toString(), updatedSettings.amountOfXp.toString()] })
		.button1({ translate: 'bt.xb.confirm.no' })
		.button2({ translate: 'bt.xb.confirm.yes' });

	let saveSettings = true;
	if (!settingsResponse.canceled) {
		if (updatedSettings.amountOfXp !== currentSettings.amountOfXp) {
			saveSettings = await confirmationInterface(player, confirmForm);
		}
	} else {
		void openConfigInterface(player);
	}
	if (saveSettings) {
		void setSettings(updatedSettings);
	} else {
		void openSettingsInterface(player);
	}
};
