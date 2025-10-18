import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { getSettings, setSettings } from '../Actions';
import { GravesSettings } from '../Models';
import { openConfigInterface } from './Config';

export const openSettingsInterface = (player: Player): void => {
	const gravesSettings: GravesSettings = getSettings();

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.graves.settings.title' })
		.toggle({ translate: 'bt.graves.settings.grave_robbing', with: ['\n'] }, { defaultValue: gravesSettings.graveRobbing })
		.toggle({ translate: 'bt.graves.settings.xp_collection', with: ['\n'] }, { defaultValue: gravesSettings.xpCollection })
		.toggle({ translate: 'bt.graves.settings.grave_locating', with: ['\n'] }, { defaultValue: gravesSettings.graveLocating })
		.slider({ translate: 'bt.graves.settings.despawn_time.hours', with: ['\n'] }, 0, 24, { defaultValue: Math.floor(gravesSettings.despawnTime / 3600), valueStep: 1 })
		.slider({ translate: 'bt.graves.settings.despawn_time.minutes', with: ['\n'] }, 0, 59, { defaultValue: Math.floor(gravesSettings.despawnTime % 3600 / 60), valueStep: 1 })
		.slider({ translate: 'bt.graves.settings.despawn_time.seconds', with: ['\n'] }, 0, 59, { defaultValue: gravesSettings.despawnTime % 60, valueStep: 1 });

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// Toggle = boolean
			// Slider = number
			// Togggle, Toggle, Toggle, Slider, Slider, Slider
			const formValues: [boolean, boolean, boolean, number, number, number] = response.formValues as [boolean, boolean, boolean, number, number, number];

			gravesSettings.graveRobbing = formValues[0];
			gravesSettings.xpCollection = formValues[1];
			gravesSettings.graveLocating = formValues[2];
			gravesSettings.despawnTime = formValues[3] * 3600 + formValues[4] * 60 + formValues[5];
		}

		if (!response.canceled) {
			setSettings(gravesSettings);

			openConfigInterface(player);
		}
	});
};
