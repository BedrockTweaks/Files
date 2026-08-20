/**
 * §6 — lazy self-healing. Whenever a grave entity loads: adopt orphans the
 * index lost (crash, restored backup), execute pending tombstones (§6a), and
 * refresh a drifted position. Index records are NEVER deleted from
 * `entityRemove` — that event cannot tell unload from deletion.
 */
import { world } from '@minecraft/server';
import { GRAVE_INVENTORY_SIZE, PROP_DIED_AT, PROP_OWNER, PROP_OWNER_NAME, PROP_XP, PROP_CAUSE, PROP_KILLER } from '../constants';
import { graveContainer, isGrave, removeGrave } from '../lifecycle';
import { addRecord, byEntityId, updateRecord } from './store';
import type { Entity } from '@minecraft/server';
import type { GraveRecord } from '../types';

const adopt = (entity: Entity): void => {
  const owner = entity.getDynamicProperty(PROP_OWNER);
  const ownerName = entity.getDynamicProperty(PROP_OWNER_NAME);

  if (typeof owner !== 'string' || typeof ownerName !== 'string') {
    return; // not a grave we ever filled — leave it alone
  }

  const container = graveContainer(entity);
  let items = 0;

  if (container) {
    for (let slot = 0; slot < GRAVE_INVENTORY_SIZE && slot < container.size; slot++) {
      items += container.getItem(slot)?.amount ?? 0;
    }
  }

  const xp = entity.getDynamicProperty(PROP_XP);
  const diedAt = entity.getDynamicProperty(PROP_DIED_AT);
  const cause = entity.getDynamicProperty(PROP_CAUSE);
  const killer = entity.getDynamicProperty(PROP_KILLER);

  const record: GraveRecord = {
    id: entity.id,
    owner,
    ownerName,
    dim: entity.dimension.id,
    x: Math.floor(entity.location.x),
    y: Math.floor(entity.location.y),
    z: Math.floor(entity.location.z),
    diedAt: typeof diedAt === 'number' ? diedAt : Date.now(),
    items,
    xp: typeof xp === 'number' ? xp : 0,
    ...typeof cause === 'string' ? { cause } : {},
    ...typeof killer === 'string' ? { killer } : {},
  };

  addRecord(record);
  console.info(`[graves] adopted orphan grave ${entity.id} for ${ownerName}`);
};

export function initReconcile(): void {
  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    if (!isGrave(entity)) {
      return;
    }

    const record = byEntityId(entity.id);

    if (!record) {
      adopt(entity);

      return;
    }

    if (record.purge) {
      removeGrave(entity);

      return;
    }

    const x = Math.floor(entity.location.x);
    const y = Math.floor(entity.location.y);
    const z = Math.floor(entity.location.z);

    if (record.x !== x || record.y !== y || record.z !== z || record.dim !== entity.dimension.id) {
      updateRecord({ ...record, x, y, z, dim: entity.dimension.id });
    }
  });
}
