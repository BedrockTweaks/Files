/**
 * Spawn the grave entity at a solved placement, fill its engine-persisted
 * container (rows 1–3 hold player slots 9–35, row 4 holds hotbar slots 0–8,
 * and slots 36–40 hold equipment),
 * write its documents. The entity is frozen by its own
 * components — position is set exactly once, here.
 */
import { world } from '@minecraft/server';
import type { Dimension, Entity, ItemStack, Player } from '@minecraft/server';
import { config } from '../registration';
import { graveDocuments, graveDirectory as graves } from '../storage/documents';
import {
  GRAVE_ENTITY,
  GRAVE_INVENTORY_SIZE,
  PLAYER_CONTAINER_SLOTS,
  playerSlotForGraveSlot,
} from '../constants';
import { graveContainer } from '../inventory';
import { i18n } from '../UI/i18n';
import { dateStamp } from '../util';
import type { GraveRecord, Placement } from '../types';

export interface DeathSnapshot {
  /** Player container by slot, 0–35. */
  items: (ItemStack | undefined)[];
  /** Head, Chest, Legs, Feet, Offhand. */
  equipment: (ItemStack | undefined)[];
  itemCount: number;
  xp: number;
  cause?: string;
  killer?: string;
}

const nameFor = (owner: Player, diedAt: number): string => {
  const style = config.player.for(owner).graveNameStyle.get();

  if (style === 'hidden') {
    return '';
  }

  const name = i18n.forPlayer(owner).t($ => $.grave.name, { owner: owner.name });

  return style === 'name_and_time' ? `${name}\n§7${dateStamp(diedAt)}` : name;
};

/**
 * Returns the index record, or undefined if the engine refused the 41-slot
 * container — in that case the grave is removed again and the caller leaves
 * the player's inventory untouched (keepInventory means nothing is lost).
 */
export function spawnGrave(dim: Dimension, placement: Placement, owner: Player, snapshot: DeathSnapshot): GraveRecord | undefined {
  const diedAt = Date.now();
  let grave: Entity;

  try {
    grave = dim.spawnEntity(GRAVE_ENTITY, { x: placement.x + 0.5, y: placement.y, z: placement.z + 0.5 });
  } catch (error) {
    console.error(`[graves] failed to spawn grave entity: ${String(error)}`);

    return undefined;
  }

  const container = graveContainer(grave);

  if (!container || container.size < GRAVE_INVENTORY_SIZE) {
    console.error(`[graves] grave container unavailable or too small (${String(container?.size)}) — aborting, player keeps items`);
    grave.remove();

    return undefined;
  }

  for (let graveSlot = 0; graveSlot < PLAYER_CONTAINER_SLOTS; graveSlot++) {
    const item = snapshot.items[playerSlotForGraveSlot(graveSlot)];

    if (item) {
      container.setItem(graveSlot, item);
    }
  }

  for (let i = 0; i < snapshot.equipment.length; i++) {
    const item = snapshot.equipment[i];

    if (item) {
      container.setItem(PLAYER_CONTAINER_SLOTS + i, item);
    }
  }

  grave.nameTag = nameFor(owner, diedAt);

  const record: GraveRecord = {
    id: grave.id,
    owner: owner.id,
    ownerName: owner.name,
    dim: grave.dimension.id,
    x: placement.x,
    y: placement.y,
    z: placement.z,
    diedAt,
    items: snapshot.itemCount,
    xp: snapshot.xp,
    ...snapshot.cause ? { cause: snapshot.cause } : {},
    ...snapshot.killer ? { killer: snapshot.killer } : {},
    ...placement.floating ? { floating: true as const } : {},
  };

  graveDocuments.for(grave).set(record);
  graves.patch({ records: { [record.id]: record } });

  return record;
}

export const dimensionFor = (placement: Placement, fallback: Dimension): Dimension => (placement.dim ? world.getDimension(placement.dim) : fallback);
