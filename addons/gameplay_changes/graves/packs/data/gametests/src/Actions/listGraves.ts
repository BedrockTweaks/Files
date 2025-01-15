import {
	Player,
	system,
	TicksPerSecond,
	world
} from '@minecraft/server';
import { Grave, GravesList, GravesListDynamicProperties } from '../Models';
import { getProperties } from '../Util';

/**
 * Lists all graves associated with the player.
 *
 * Retrieves the global graves list, organizes them by owner, sorts each owner's graves by spawn time,
 * and sends the information to the specified player. If no graves are found, notifies the player accordingly.
 *
 * @param {Player} player - The player to whom the grave list will be sent.
 */
// TODO move to UI in UI update
export const listAllGraves = (player: Player): void => {
	const gravesList: Grave[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

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

	if (sortedGraves.length) {
		player.sendMessage({ translate: 'bt.graves.list_graves.title' });
		sortedGraves.forEach((playerGraves: Grave[]): void => {
			player.sendMessage({ translate: 'bt.graves.list_graves.owner', with: [playerGraves[0].ownerName ?? ''] });

			playerGraves.forEach((grave: Grave): void => {
				const { hours, minutes }: { hours: number; minutes: number } = getTimeDifference(grave.spawnTime, system.currentTick);

				player.sendMessage({
					translate: 'bt.graves.list_graves.grave',
					with: [
						grave.location.x.toFixed(0),
						grave.location.y.toFixed(0),
						grave.location.z.toFixed(0),
						grave.dimension,
						hours + '',
						minutes + '',
						grave.itemCount + '',
						grave.playerExperience + '',
					],
				});
			});
		});
	} else {
		player.sendMessage({ translate: 'bt.graves.list_graves.empty' });
	}
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
