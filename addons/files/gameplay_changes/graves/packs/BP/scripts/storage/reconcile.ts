import { system, world, type Entity } from '@minecraft/server';
import { GRAVE_ENTITY, SHAKING_PROPERTY } from '../constants';
import { isGrave, removeGrave } from '../lifecycle';
import { graveContainer } from '../inventory';
import { graveDocuments, graveDirectory } from './documents';

/** Refresh loaded graves and execute the directory's pending removals. */
export const reconcileGrave = (entity: Entity): void => {
  if (!entity.isValid || !isGrave(entity)) {
    return;
  }

  const indexed = graveDirectory.get()?.records[entity.id];

  if (indexed?.purge) {
    removeGrave(entity);

    return;
  }

  const stored = graveDocuments.for(entity).get();

  if (!stored) {
    return;
  }

  const container = graveContainer(entity);

  if (!container) {
    return;
  }

  let items = 0;

  for (let slot = 0; slot < container.size; slot++) {
    items += container.getItem(slot)?.amount ?? 0;
  }

  const record = {
    ...stored, ...indexed, id: entity.id, items,
    dim: entity.dimension.id,
    x: Math.floor(entity.location.x), y: Math.floor(entity.location.y), z: Math.floor(entity.location.z),
  };

  graveDocuments.for(entity).set(record);
  graveDirectory.patch({ records: { [entity.id]: record } });
  entity.setProperty(SHAKING_PROPERTY, false);
};

export const initReconcile = (): void => {
  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    reconcileGrave(entity);
  });
  system.run(() => {
    for (const id of ['overworld', 'nether', 'the_end']) {
      for (const entity of world.getDimension(id).getEntities({ type: GRAVE_ENTITY })) {
        reconcileGrave(entity);
      }
    }
  });
};
