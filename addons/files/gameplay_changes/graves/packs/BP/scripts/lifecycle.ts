/**
 * Grave entity plumbing shared by every open/removal path. The ONLY removal
 * call in the codebase is `entity.remove()` — never `kill` (the damage sensor
 * makes graves unkillable by design, §3a).
 */
import { EntityComponentTypes, EquipmentSlot, world } from '@minecraft/server';
import type { Container, Entity, ItemStack, Player, Vector3 } from '@minecraft/server';
import { GRAVE_ENTITY, PROP_XP } from './constants';
import { removeRecord } from './index/store';

/** Grave container slots 36–40, in order (§6 slot mapping). */
export const EQUIP_SLOTS: readonly EquipmentSlot[] = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Offhand,
];

export const isGrave = (entity: Entity): boolean => entity.typeId === GRAVE_ENTITY;

/** The grave entity for a record, if its chunk is loaded. */
export const graveEntity = (graveId: string): Entity | undefined => {
  const entity = world.getEntity(graveId);

  return entity && isGrave(entity) ? entity : undefined;
};

export const graveContainer = (grave: Entity): Container | undefined => grave.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;

export const graveXp = (grave: Entity): number => {
  const xp = grave.getDynamicProperty(PROP_XP);

  return typeof xp === 'number' ? xp : 0;
};

/** Delete the index record, then the entity — always in that order (§6). */
export const removeGrave = (grave: Entity): void => {
  removeRecord(grave.id);
  grave.remove();
};

export const grantXp = (player: Player, amount: number): void => {
  if (amount > 0) {
    player.addExperience(amount);
    player.playSound('random.levelup', { volume: 0.4 });
  }
};

export const dropAt = (grave: Entity, item: ItemStack, at?: Vector3): void => {
  grave.dimension.spawnItem(item, at ?? grave.location);
};
