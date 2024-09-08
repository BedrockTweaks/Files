import {
  Player,
  world
} from '@minecraft/server';
import { Grave, GravesList, GravesListDynamicProperties } from '../Models/DynamicProperties';
import { getProperties } from '../Util';

export const listAllGraves = (player: Player): void => {
  const gravesList: Grave[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

  const gravesByOwner = gravesList.reduce((accumulator: { [owner: string]: Grave[] }, grave: Grave): { [owner: string]: Grave[] } => {
    if (!accumulator[grave.owner]) {
      accumulator[grave.owner] = [];
    }
    accumulator[grave.owner].push(grave);

    return accumulator;
  }, {});

  // Sort each owner's graves by spawnTime (oldest to newest)
  const sortedGraves = Object.values(gravesByOwner).map((group: Grave[]): Grave[] => group.sort((a: Grave, b: Grave): number => a.spawnTime - b.spawnTime));

  if (sortedGraves.length) {
    player.sendMessage({ translate: 'bt.graves.list_graves.title' });
    sortedGraves.forEach((playerGraves: Grave[]): void => {
      player.sendMessage({ translate: 'bt.graves.list_graves.owner', with: [playerGraves[0].owner] });
      playerGraves.forEach((grave: Grave): void => {
        const { hours, minutes } = getTimeDifferenceFromAbsoluteTimes(grave.spawnTime, world.getAbsoluteTime());

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

const getTimeDifferenceFromAbsoluteTimes = (absTime1: number, absTime2: number): { hours: number; minutes: number } => {
  // Calculate the difference in ticks
  const tickDifference = Math.abs(absTime1 - absTime2);

  // Convert the tick difference to seconds (1 tick = 1/20th of a second)
  const timeDifferenceInSeconds = tickDifference / 20;

  // Convert the time difference to hours and minutes
  const hours = Math.floor(timeDifferenceInSeconds / 3600); // 3600 seconds in an hour
  const minutes = Math.floor(timeDifferenceInSeconds % 3600 / 60); // Remaining seconds to minutes

  return { hours, minutes };
};
