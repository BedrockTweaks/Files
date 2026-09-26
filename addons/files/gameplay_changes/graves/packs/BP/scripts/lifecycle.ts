/**
 * Grave entity plumbing shared by every open/removal path. The ONLY removal
 * call in the codebase is `entity.remove()` — never `kill` (the damage sensor
 * makes graves unkillable by design, §3a).
 */
import { world } from '@minecraft/server';
import type { Entity, ItemStack, Player, Vector3 } from '@minecraft/server';
import { GRAVE_ENTITY } from './constants';
import { graveDocuments, graveDirectory as graves } from './storage/documents';

export const isGrave = (entity: Entity): boolean => entity.typeId === GRAVE_ENTITY;

/** The grave entity for a record, if its chunk is loaded. */
export const graveEntity = (graveId: string): Entity | undefined => {
  const entity = world.getEntity(graveId);

  return entity && isGrave(entity) ? entity : undefined;
};

export const graveXp = (grave: Entity): number => graveDocuments.for(grave).get()?.xp ?? 0;

/** Delete the index record, then the entity — always in that order (§6). */
export const removeGrave = (grave: Entity): void => {
  graves.patch({ records: { [grave.id]: undefined } });
  graveDocuments.for(grave).delete();
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
