/**
 * Despawn timer. Ages come from the index (epoch ms), so a grave's age
 * survives chunk unloads and restarts. Loaded expired graves are removed on
 * the spot; unloaded ones are tombstoned and die when their chunk loads.
 */
import { system } from '@minecraft/server';
import { config } from './registration';
import { graveEntity, removeGrave } from './lifecycle';
import { allRecords, markPurge } from './index/store';

const SWEEP_INTERVAL_TICKS = 200; // every 10 s — despawn granularity is seconds anyway

export function initDespawn(): void {
  system.runInterval(() => {
    const seconds = config.server.lifetime.despawnSeconds.get();

    if (seconds <= 0) {
      return;
    }

    const cutoff = Date.now() - seconds * 1000;

    for (const record of allRecords()) {
      if (record.diedAt > cutoff) {
        continue;
      }

      const entity = graveEntity(record.id);

      if (entity) {
        removeGrave(entity);
      } else {
        markPurge(record.id);
      }
    }
  }, SWEEP_INTERVAL_TICKS);
}
