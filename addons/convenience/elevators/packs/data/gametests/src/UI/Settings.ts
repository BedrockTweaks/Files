import { world, Player } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { ElevatorsSettings, ElevatorsBlocksSettings, ElevatorsBlockIndividualSettings, ElevatorsBlockIndividualSettingsIds, FacingDirections } from '../Models';
import { getSettings, setSettings, getBlocksSettings, setBlocksSettings } from '../Actions';
import { itemUseOnEventSubscription } from '../Events';
import { openConfigInterface } from './Config';

/**
 * @name openSettingsInterface
 * @param {Player} player - The player who wants to open the UI.
 * @remarks Opens the settings UI for the player.
 */
export const openSettingsInterface = (player: Player): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();

	if (!elevatorsSettings.initialized) return;

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.elevators.settings.title' })
		.dropdown({ translate: 'bt.elevators.settings.default_facing_direction', with: ['\n'] }, FacingDirections.map((word: string): string => word[0]!.toUpperCase() + word.slice(1)), FacingDirections.indexOf(elevatorsSettings.defaultFacingDirection))
		.toggle({ translate: 'bt.elevators.settings.elevators_tick_particles', with: ['\n'] }, elevatorsSettings.elevatorsTickParticles)
		.toggle({ translate: 'bt.elevators.settings.same_color_teleport', with: ['\n'] }, elevatorsSettings.sameColorTeleport)
		.toggle({ translate: 'bt.elevators.settings.safe_teleport', with: ['\n'] }, elevatorsSettings.safeTeleport)
		.toggle({ translate: 'bt.elevators.settings.camouflage', with: ['\n'] }, elevatorsSettings.camouflage)
		.textField({ translate: 'bt.elevators.settings.xp_levels_use', with: ['\n'] }, '69', `${elevatorsSettings.xpLevelsUse}`);

	form.show(player).then((formResponse: ModalFormResponse): void => {
		if (formResponse.canceled) {
			openConfigInterface(player);

			return;
		}

		// Dropdown = number
		// Toggle = boolean
		// TextField = string
		// Dropdown, Toggle, Toggle, Toggle, Toggle, TextField
		const formValues: [number, boolean, boolean, boolean, boolean, string] = formResponse.formValues as [number, boolean, boolean, boolean, boolean, string];
		const formValue5: number = Number(formValues[5]);

		if (isNaN(formValue5) || !Number.isInteger(formValue5) || formValue5 < 0 || formValue5 > 1000) {
			player.sendMessage({ translate: 'bt.elevators.settings.invalid_number' });

			return;
		}

		elevatorsSettings.defaultFacingDirection = FacingDirections[formValues[0]]!;
		elevatorsSettings.elevatorsTickParticles = formValues[1];
		elevatorsSettings.sameColorTeleport = formValues[2];
		elevatorsSettings.safeTeleport = formValues[3];
		elevatorsSettings.camouflage = formValues[4];
		elevatorsSettings.xpLevelsUse = formValue5;

		const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

		if (!elevatorsBlocksSettings.initialized) return;

		const elevatorsAllBlockSettings: ElevatorsBlockIndividualSettings[] = JSON.parse(elevatorsBlocksSettings.allBlockSettings) as ElevatorsBlockIndividualSettings[];

		const updatedElevatorsAllBlockSettings: ElevatorsBlockIndividualSettings[] = [];
		for (const blockSettings of elevatorsAllBlockSettings) {
			if (!blockSettings[ElevatorsBlockIndividualSettingsIds.isConfigured]) {
				blockSettings[ElevatorsBlockIndividualSettingsIds.facingDirection] = elevatorsSettings.defaultFacingDirection;
			}

			if (!elevatorsSettings.elevatorsTickParticles) {
				blockSettings[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles] = blockSettings[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles];
				blockSettings[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles] = false;
			} else {
				if (blockSettings[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles] !== undefined) {
					blockSettings[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles] = blockSettings[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles];
					blockSettings[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles] = undefined;
				}
			}

			updatedElevatorsAllBlockSettings.push(blockSettings);
		}

		elevatorsBlocksSettings.allBlockSettings = JSON.stringify(updatedElevatorsAllBlockSettings);

		if (elevatorsSettings.camouflage) {
			world.beforeEvents.itemUseOn.subscribe(itemUseOnEventSubscription);
		} else {
			world.beforeEvents.itemUseOn.unsubscribe(itemUseOnEventSubscription);
		}

		setSettings(elevatorsSettings);
		setBlocksSettings(elevatorsBlocksSettings);
	});
};
