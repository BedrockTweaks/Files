import { EntityComponentTypes, EquipmentSlot, type Entity } from '@minecraft/server';
import type { NamedContainer } from '@bedrock-core/ui';
import { graveScreen } from './UI/grave_container';

/** Grave container slots 36–40, in order (§6 slot mapping). */
export const EQUIP_SLOTS: readonly EquipmentSlot[] = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand,
];

export const graveContainer = (grave: Entity): NamedContainer<string> | undefined => {
  const raw = grave.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;

  return raw ? graveScreen.container(grave) : undefined;
};
