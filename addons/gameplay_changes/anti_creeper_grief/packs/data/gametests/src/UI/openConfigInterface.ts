import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { AntiCreeperGriefSettings } from '../Models';
import { getSettings, setSettings } from '../Actions';

export const openConfigInterface = (player: Player): void => {
	const AntiCreeperGriefSettings: AntiCreeperGriefSettings = getSettings();
	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.acg.config.title' })
		.toggle({ translate: 'bt.acg.config.do_damage', with: ['\n'] }, AntiCreeperGriefSettings.creeperDoDamage);

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			const formValues: [boolean] = response.formValues as [boolean];

			AntiCreeperGriefSettings.creeperDoDamage = formValues[0];
		}

		if (!response.canceled) {
			setSettings(AntiCreeperGriefSettings);

			// openConfigInterface(player);
		}
	});
};
