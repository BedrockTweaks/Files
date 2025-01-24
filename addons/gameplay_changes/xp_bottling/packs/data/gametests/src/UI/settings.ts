import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { XpBottlingSettings } from '../Models';
import { getSettings, setSettings } from '../Actions';
import { openConfigInterface } from './config';

export const openSettingsInterface = (player: Player): void => {
	const xpBottlingSettings: XpBottlingSettings = getSettings();

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.settings.title' });

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// Toggle = boolean
			// Slider = number
			const formValues: [] = response.formValues as [];
		}

		if (!response.canceled) {
			setSettings(xpBottlingSettings);

			openConfigInterface(player);
		}
	});
};
