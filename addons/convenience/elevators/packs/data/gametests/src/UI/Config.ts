import { Player } from '@minecraft/server';
import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import { openSettingsInterface } from './Settings';
import { openReceiveElevatorInterface } from './ReceiveElevator';

/**
 * @name openConfigInterface
 * @param {Player} player - The player who wants to open the UI.
 * @remarks Opens the config UI for the player.
 */
export const openConfigInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.elevators.config.title' })
		.button({ translate: 'bt.elevators.config.change_settings' })
		.button({ translate: 'bt.elevators.config.receive_elevator' });

	form.show(player).then((formResponse: ActionFormResponse): void => {
		if (formResponse.canceled) return;

		switch (formResponse.selection) {
			case 0:
				openSettingsInterface(player);

				break;
			case 1:
				openReceiveElevatorInterface(player);

				break;
		}
	});
};
