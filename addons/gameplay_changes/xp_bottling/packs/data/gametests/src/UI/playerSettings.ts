import { Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { getPlayerSettings, setPlayerSettings } from '../Actions';
import { PlayerXpBottlingSettings } from '../Models';

export const openPlayerSettingsInterface = (player: Player): void => {
	const playerXpBottlingSettings: PlayerXpBottlingSettings = getPlayerSettings(player);

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.xb.playerSettings.title' })
		.toggle({ translate: 'bt.xb.playerSettings.enableToolTips', with: ['\n'] }, playerXpBottlingSettings.enableToolTips)
		.toggle({ translate: 'bt.xb.playerSettings.consumeFullStack', with: ['\n'] }, playerXpBottlingSettings.consumeFullStack)
		.toggle({ translate: 'bt.xb.playerSettings.fillFullStack', with: ['\n'] }, playerXpBottlingSettings.fillFullStack);

	form.show(player).then((response: ModalFormResponse): void => {
		if (response.formValues) {
			// toggle = boolean
			// slider = number
			// textField = string
			const formValues: [boolean, boolean, boolean] = response.formValues as [boolean, boolean, boolean];

			playerXpBottlingSettings.enableToolTips = formValues[0];
			playerXpBottlingSettings.consumeFullStack = formValues[1];
			playerXpBottlingSettings.fillFullStack = formValues[2];
		}

		if (!response.canceled) {
			setPlayerSettings(player, playerXpBottlingSettings);
		}
	});
};
