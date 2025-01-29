import { Player, Block } from '@minecraft/server';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';
import { ElevatorsSettings, ElevatorsBlocksSettings, ElevatorsBlockIndividualSettings, ElevatorsBlockIndividualSettingsIds, FacingDirections } from '../Models';
import { getSettings, getBlocksSettings, setBlocksSettings, getElevatorBlockSettings, deleteElevatorBlockSettings } from '../Actions';

/**
 * @name openBlockSettings
 * @param {Player} player - The player who wants to open the UI.
 * @param {Block} elevatorBlock - The elevator block which has to set its block settings for.
 * @remarks Opens the block settings UI for the player.
 */
export const openBlockSettings = (player: Player, elevatorBlock: Block): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();
	const elevatorBlockSettings: ElevatorsBlockIndividualSettings | undefined = getElevatorBlockSettings(elevatorBlock);

	if (!elevatorBlockSettings) return;

	const form: ModalFormData = new ModalFormData()
		.title({ translate: 'bt.elevators.block_settings.title' })
		.dropdown({ translate: 'bt.elevators.block_settings.facing_direction', with: ['\n', elevatorsSettings.defaultFacingDirection[0]!.toUpperCase() + elevatorsSettings.defaultFacingDirection.slice(1)] }, FacingDirections.map((word: string): string => word[0]!.toUpperCase() + word.slice(1)), FacingDirections.indexOf(elevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.facingDirection]));

	if (elevatorsSettings.elevatorsTickParticles) form.toggle({ translate: 'bt.elevators.block_settings.elevator_tick_particles', with: ['\n'] }, elevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]);

	form.show(player).then((formResponse: ModalFormResponse): void => {
		if (formResponse.canceled) return;

		const updatedElevatorBlockSettings: ElevatorsBlockIndividualSettings | undefined = getElevatorBlockSettings(elevatorBlock);

		if (!updatedElevatorBlockSettings) {
			player.sendMessage({ translate: 'bt.elevators.block_settings.invalid_elevator_block' });

			return;
		}

		// Dropdown = number
		// Toggle = boolean
		// Dropdown, Toggle | Dropdown
		const formValues: [number, boolean] | [number] = formResponse.formValues as [number, boolean] | [number];

		deleteElevatorBlockSettings(elevatorBlock);

		const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

		elevatorsBlocksSettings.allBlockSettings = JSON.stringify(
			[
				...JSON.parse(elevatorsBlocksSettings.allBlockSettings),
				{
					[ElevatorsBlockIndividualSettingsIds.isConfigured]: true,
					[ElevatorsBlockIndividualSettingsIds.blockLocation]: updatedElevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.blockLocation],
					[ElevatorsBlockIndividualSettingsIds.blockDimension]: updatedElevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.blockDimension],
					[ElevatorsBlockIndividualSettingsIds.facingDirection]: FacingDirections[formValues[0]]!,
					[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]: elevatorsSettings.elevatorsTickParticles ? formValues[1]! : false,
					[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles]: updatedElevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles],
				} as ElevatorsBlockIndividualSettings,
			],
		);

		setBlocksSettings(elevatorsBlocksSettings);
	});
};
