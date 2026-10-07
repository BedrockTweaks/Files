/**
 * Despawn timer. Ages come from the index (epoch ms), so a grave's age
 * survives chunk unloads and restarts. Loaded expired graves are removed on
 * the spot; unloaded ones are tombstoned and die when their chunk loads.
 */
import { system } from '@minecraft/server';
import { config } from './registration';
import { graveDirectory as graves } from './storage/documents';
import { graveEntity, removeGrave } from './lifecycle';

const SWEEP_INTERVAL_TICKS = 200; // every 10 s — despawn granularity is seconds anyway

export function initDespawn(): void {
  system.runInterval(() => {
    const seconds = config.server.lifetime.despawnSeconds.get();

    if (seconds <= 0) {
      return;
    }

    const cutoff = Date.now() - seconds * 1000;

    for (const record of Object.values(graves.get()?.records ?? {}).filter(record => !record.purge)) {
      if (record.diedAt > cutoff) {
        continue;
      }

      const entity = graveEntity(record.id);

      if (entity) {
        removeGrave(entity);
      } else {
        graves.patch({ records: { [record.id]: { ...record, purge: true } } });
      }
    }
  }, SWEEP_INTERVAL_TICKS);
}
