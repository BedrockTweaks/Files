import {
  Player,
  world
} from '@minecraft/server';
import { GravesList, GravesListDynamicProperties } from '../Models/DynamicProperties';
import { getProperties } from '../Util';

export const listAllGraves = (player: Player): void => {
  const gravesList: string[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

  gravesList.forEach(graveId => {
    const grave = world.getEntity(graveId);
    player.sendMessage(grave?.nameTag ?? 'itsundefined');
  });
};
