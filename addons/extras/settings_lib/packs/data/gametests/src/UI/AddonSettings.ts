import { Player, RawMessage } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { AddonUIInformation } from '../Models';
import { openSettingsInterface } from './Settings';

/**
 * @name openAddonSettingsInterface
 * @param {Player} player - The player who wants to open the UI.
 * @param {string | RawMessage} addonName - The addon name which can either be in a string or a RawMessage to be displayed in the form title.
 * @param {string[]} addonSettingsOptions - All the addon settings options which are visible to the current player.
 * @param {AddonUIInformation} addonUIInfo - The addon UI information to be used.
 * @remarks Opens the addon settings UI for the player.
 */
export const openAddonSettingsInterface = (player: Player, addonName: string | RawMessage, addonSettingsOptions: string[], addonUIInfo: AddonUIInformation): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.settingsLib.addonSettings.title', with: typeof addonName === 'object' ? { rawtext: [addonName] } : [addonName] });

	for (const settingsOptions of addonSettingsOptions) {
		const rawMessage: RawMessage | undefined = addonUIInfo[settingsOptions]!.rawMessage;
		const option: string | RawMessage = rawMessage ? rawMessage : settingsOptions;

		form.button(option);
	}

	form.show(player).then((formResponse: ActionFormResponse): void => {
		if (formResponse.canceled) {
			openSettingsInterface(player);

			return;
		}

		const selectedSetting: string = addonSettingsOptions[formResponse.selection!]!;

		player.runCommand(`execute as @s run scriptevent ${addonUIInfo[selectedSetting]!.id}`);
	});
};
