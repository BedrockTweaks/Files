import {
	Player,
	system,
	TicksPerSecond,
	world
} from '@minecraft/server';
import { ActionFormData, ActionFormResponse, MessageFormData, MessageFormResponse } from '@minecraft/server-ui';
import { Grave, GravesList, GravesListDynamicProperties } from '../Models';
import { getProperties } from '../Util';

/**
 * Lists all graves associated with the player.
 *
 * Retrieves the global graves list, organizes them by owner, sorts each owner's graves by spawn time,
 * and displays the information in a UI form to the specified player. If no graves are found, notifies the player accordingly.
 *
 * @param {Player} player - The player to whom the grave list will be shown.
 */
export const listAllGraves = (player: Player): void => {
	const gravesList: Grave[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

	if (gravesList.length === 0) {
		// No graves found
		const form: MessageFormData = new MessageFormData()
			.title({ translate: 'bt.graves.list_graves.title' })
			.body({ translate: 'bt.graves.list_graves.empty' })
			.button1({ translate: 'bt.graves.ui.ok' })
			.button2({ translate: 'bt.graves.ui.ok' });

		form.show(player);
		return;
	}

	// Groups graves by owner
	const gravesByOwner: { [owner: string]: Grave[] } =
		gravesList.reduce((accumulator: { [owner: string]: Grave[] }, grave: Grave): { [owner: string]: Grave[] } => {
			if (!accumulator[grave.ownerId]) {
				accumulator[grave.ownerId] = [];
			}
			accumulator[grave.ownerId].push(grave);

			return accumulator;
		}, {});

	// Sort each owner's graves by spawnTime (oldest to newest)
	const sortedGraves: Grave[][] = Object.values(gravesByOwner).map((group: Grave[]): Grave[] => group.sort((a: Grave, b: Grave): number => a.spawnTime - b.spawnTime));

	// Build the grave list body text
	let bodyText: string = '';
	sortedGraves.forEach((playerGraves: Grave[]): void => {
		bodyText += `§l${playerGraves[0].ownerName ?? 'Unknown'}§r\n`;

		playerGraves.forEach((grave: Grave, index: number): void => {
			const { hours, minutes }: { hours: number; minutes: number } = getTimeDifference(grave.spawnTime, system.currentTick);

			bodyText += `  ${index + 1}. [${grave.location.x.toFixed(0)}, ${grave.location.y.toFixed(0)}, ${grave.location.z.toFixed(0)}]\n`;
			bodyText += `     §7${grave.dimension}§r\n`;
			bodyText += `     §7Time: ${hours}h ${minutes}m | Items: ${grave.itemCount} | XP: ${grave.playerExperience}§r\n`;
		});

		bodyText += '\n';
	});

	// Create an action form to display the graves list
	const form: ActionFormData = new ActionFormData()
		.title({ translate: 'bt.graves.list_graves.title' })
		.body(bodyText);

	// Add a button for each player's graves
	sortedGraves.forEach((playerGraves: Grave[]): void => {
		const ownerName: string = playerGraves[0].ownerName ?? 'Unknown';
		const graveCount: number = playerGraves.length;
		
		form.button(`${ownerName} (${graveCount} grave${graveCount !== 1 ? 's' : ''})`);
	});

	form.show(player).then((response: ActionFormResponse): void => {
		if (response.canceled || response.selection === undefined) {
			return;
		}

		// Show details for selected player's graves
		const selectedGraves: Grave[] = sortedGraves[response.selection];
		showGraveDetails(player, selectedGraves);
	});
};

/**
 * Shows detailed information about a player's graves
 *
 * @param {Player} player - The player viewing the details
 * @param {Grave[]} graves - The list of graves to display
 */
const showGraveDetails = (player: Player, graves: Grave[]): void => {
	let detailText: string = '';

	graves.forEach((grave: Grave, index: number): void => {
		const { hours, minutes }: { hours: number; minutes: number } = getTimeDifference(grave.spawnTime, system.currentTick);

		detailText += `§l§6Grave ${index + 1}§r\n`;
		detailText += `§7Location: §r[${grave.location.x.toFixed(0)}, ${grave.location.y.toFixed(0)}, ${grave.location.z.toFixed(0)}]\n`;
		detailText += `§7Dimension: §r${grave.dimension}\n`;
		detailText += `§7Time since death: §r${hours} hours ${minutes} minutes\n`;
		detailText += `§7Items: §r${grave.itemCount}\n`;
		detailText += `§7Experience: §r${grave.playerExperience}\n\n`;
	});

	const form: MessageFormData = new MessageFormData()
		.title(`${graves[0].ownerName ?? 'Unknown'}'s Graves`)
		.body(detailText)
		.button1({ translate: 'bt.graves.ui.ok' })
		.button2({ translate: 'bt.graves.ui.back' });

	form.show(player).then((response: MessageFormResponse): void => {
		if (response.selection === 1) {
			// Back button - show the main list again
			listAllGraves(player);
		}
	});
};

/**
 * Calculates the time difference between two times.
 *
 * Converts the difference in ticks to hours and minutes.
 *
 * @param {number} time1 - The first time in ticks.
 * @param {number} time2 - The second time in ticks.
 * @returns {{ hours: number; minutes: number }} - The difference represented in hours and minutes.
 */
const getTimeDifference = (time1: number, time2: number): { hours: number; minutes: number } => {
	// Calculate the difference in ticks
	const tickDifference: number = Math.abs(time1 - time2);

	// Convert the tick difference to seconds
	const timeDifferenceInSeconds: number = tickDifference / TicksPerSecond;

	// Convert the time difference to hours and minutes
	const hours: number = Math.floor(timeDifferenceInSeconds / 3600); // 3600 seconds in an hour
	const minutes: number = Math.floor(timeDifferenceInSeconds % 3600 / 60); // Remaining seconds to minutes

	return { hours, minutes };
};
