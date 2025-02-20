import { Player } from '@minecraft/server';
import { MessageFormData, MessageFormResponse } from '@minecraft/server-ui';

export const confirmationInterface = async(player: Player, form: MessageFormData): Promise<boolean> => {
	const response: MessageFormResponse = await form.show(player);

	if (response.selection) {
		return true;
	}

	return false;
};
