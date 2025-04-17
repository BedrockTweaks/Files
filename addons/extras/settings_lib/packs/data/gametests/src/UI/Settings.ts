import { Player, RawMessage } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { UIData, SettingsUIInformation, AddonUIInformation, PlayerTags } from '../Models';
import { openAddonSettingsInterface } from './AddonSettings';

/**
 * @name openSettingsInterface
 * @param {Player} player - The player who wants to open the UI.
 * @remarks Opens the settings UI for the player.
 */
export const openSettingsInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.settingsLib.settings.title' });

	const allAddonNamesInForm: (string | RawMessage)[] = [];

	const isPlayerOp: boolean = player.hasTag(PlayerTags.op);

	for (const [name, uiInfo] of UIData.entries()) {
		if (Object.values(uiInfo).some((settingsInfo: SettingsUIInformation): boolean => !settingsInfo.op)) {
			form.button(name);

			allAddonNamesInForm.push(name);
		} else if (isPlayerOp) {
			form.button(name);

			allAddonNamesInForm.push(name);
		}
	}

	form.show(player).then((formResponse: ActionFormResponse): void => {
		if (formResponse.canceled) return;

		const addonName: string | RawMessage = allAddonNamesInForm[formResponse.selection!]!;

		const addonUIInfo: AddonUIInformation | undefined = UIData.get(addonName);

		// addonUIInfo can become undefined if the addonName is removed from UIData during the form open, this is an edge condition
		if (!addonUIInfo) return;

		const addonSettingsOptions: string[] = Object.keys(addonUIInfo).filter((settingsOption: string): boolean => {
			const uiInfo: SettingsUIInformation = addonUIInfo[settingsOption]!;

			return !uiInfo.op || isPlayerOp;
		});

		if (addonSettingsOptions.length === 1) {
			player.runCommand(`execute as @s run scriptevent ${addonUIInfo[addonSettingsOptions[0]!]!.id}`);

			return;
		}

		openAddonSettingsInterface(player, addonName, addonSettingsOptions, addonUIInfo);
	});
};
