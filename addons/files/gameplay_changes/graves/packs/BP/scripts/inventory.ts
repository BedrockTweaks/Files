import { EntityComponentTypes, type Entity } from '@minecraft/server';
import type { NamedContainer } from '@bedrock-core/ui';
import { graveScreen } from './UI/grave_container';

export { EQUIP_SLOTS } from './constants';

export const graveContainer = (grave: Entity): NamedContainer<string> | undefined => {
  const raw = grave.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;

  return raw ? graveScreen.container(grave) : undefined;
};
