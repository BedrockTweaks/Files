import { Player } from "@minecraft/server";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { ElevatorBlockTypes } from "../Models";
import { giveElevatorBlock } from "../Actions";
import { openConfigInterface } from "./Config";

/**
 * @name openReceiveElevatorBlockInterface
 * @param {Player} player - The player who wants to open the UI.
 * @remarks Opens the receive elevator block UI for the player.
 */
export const openReceiveElevatorBlockInterface = (player: Player): void => {
	const form: ActionFormData = new ActionFormData()
		.title({ translate: "bt.elevators.receive_elevator_block.title" });

	const allElevatorsColorList: string[] = ElevatorBlockTypes.map((elevatorBlockId: string): string => elevatorBlockId.replace(/bt:e.|_elevator/g, ""));

	for (const color of allElevatorsColorList) {
		form.button(color.split("_").map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join(" "));
	}

	form.show(player).then((formResponse: ActionFormResponse): void => {
		if (formResponse.canceled) {
			openConfigInterface(player);

			return;
		}

		giveElevatorBlock(player, allElevatorsColorList[formResponse.selection!]!);
	});
};
