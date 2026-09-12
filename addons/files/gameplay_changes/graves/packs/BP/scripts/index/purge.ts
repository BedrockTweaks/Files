/**
 * §6a — removing graves in unloaded chunks. Mechanism A (default): tombstone
 * the record now, delete the entity the moment its chunk loads. Mechanism B
 * (forcepurge): `world.tickingAreaManager` loads each grave's chunk with ONE
 * area at a time — `createTickingArea` resolves once the chunks are ticking —
 * and every area is removed in a `finally`; ticking chunks are a scarce,
 * capped resource. The manager is pack-scoped, so leftovers from a crashed
 * run are ours to sweep and cannot touch other packs' areas.
 */
import { system, world } from '@minecraft/server';
import { graveEntity, removeGrave } from '../lifecycle';
import { allRecords, markPurge, removeRecord, tombstoneCount } from './store';

export interface PurgeReport {
  total: number;
  removed: number;
  tombstoned: number;
}

/** Mechanism A. `ownerId` narrows the purge to one player's graves. */
export const purgeGraves = (ownerId?: string): PurgeReport => {
  const targets = allRecords().filter(r => !ownerId || r.owner === ownerId);
  let removed = 0;

  for (const record of targets) {
    const entity = graveEntity(record.id);

    if (entity) {
      removeGrave(entity);
      removed++;
    } else {
      markPurge(record.id);
    }
  }

  return { total: targets.length, removed, tombstoned: targets.length - removed };
};

export const pendingTombstones = (): number => tombstoneCount();

let forcePurgeRunning = false;

export const isForcePurgeRunning = (): boolean => forcePurgeRunning;

const AREA_PREFIX = 'graves_purge_';

const nextTick = async (): Promise<void> => new Promise((resolve) => {
  system.run(resolve);
});

/** Remove areas a crashed previous run may have left behind (ours only). */
const sweepStaleAreas = (): void => {
  const manager = world.tickingAreaManager;

  for (const area of manager.getAllTickingAreas()) {
    if (area.identifier.startsWith(AREA_PREFIX)) {
      try {
        manager.removeTickingArea(area);
      } catch (error) {
        console.warn(`[graves] could not remove stale ticking area '${area.identifier}': ${String(error)}`);
      }
    }
  }
};

const runForcePurge = async (): Promise<number> => {
  const manager = world.tickingAreaManager;
  const pending = allRecords(true).filter(r => r.purge);
  let count = 0;

  sweepStaleAreas();

  for (let i = 0; i < pending.length; i++) {
    const record = pending[i];
    const area = `${AREA_PREFIX}${String(i)}`;
    let dimension;

    try {
      dimension = world.getDimension(record.dim);
    } catch {
      continue; // dimension no longer exists — leave the tombstone alone
    }

    const location = { x: record.x, y: record.y, z: record.z };
    const options = { dimension, from: location, to: location };

    if (!manager.hasCapacity(options)) {
      console.warn(`[graves] no ticking-area capacity left — force purge stopped at ${String(count)} removed`);
      break;
    }

    try {
      // Resolves once the chunk is loaded and ticking.
      await manager.createTickingArea(area, options);

      // The entity itself can trail the chunk by a few ticks.
      for (let tick = 0; tick < 60 && !world.getEntity(record.id); tick++) {
        await nextTick();
      }

      const entity = world.getEntity(record.id);

      if (entity) {
        entity.remove();
        count++;
      }

      removeRecord(record.id);
    } catch (error) {
      console.warn(`[graves] force purge failed for grave ${record.id}: ${String(error)}`);
    } finally {
      try {
        if (manager.hasTickingArea(area)) {
          manager.removeTickingArea(area);
        }
      } catch (error) {
        console.warn(`[graves] could not remove ticking area '${area}': ${String(error)}`);
      }
    }

    await nextTick();
  }

  return count;
};

/**
 * Mechanism B. Physically removes every tombstoned grave by force-loading its
 * chunk. Reports back through `done(count)` when the run finishes. Returns
 * how many tombstones the run set out to remove.
 */
export function forcePurge(done: (count: number) => void): number {
  const pending = tombstoneCount();

  if (forcePurgeRunning || pending === 0) {
    return pending;
  }

  forcePurgeRunning = true;

  runForcePurge()
    .then((count) => {
      done(count);
    })
    .catch((error: unknown) => {
      console.error(`[graves] force purge aborted: ${String(error)}`);
      done(0);
    })
    .finally(() => {
      forcePurgeRunning = false;
    });

  return pending;
}
