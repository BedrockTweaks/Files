import { system, type Entity } from '@minecraft/server';
import { GRAVE_ENTITY } from '../constants';
import { config } from '../registration';

export const REPELLING_TAG = 'bt:gc_graves.repelling';

const vanillaIds = new Set([GRAVE_ENTITY, 'minecraft:ender_crystal', 'minecraft:shulker', 'minecraft:armor_stand']);
const runtimeIds = new Set<string>();
let configIds = new Set<string>();
const normalize = (id: string): string => id.includes(':') ? id : `minecraft:${id}`;

export const isRepelling = (entity: Entity): boolean => {
  try {
    return vanillaIds.has(entity.typeId) || runtimeIds.has(entity.typeId)
      || configIds.has(entity.typeId) || entity.hasTag(REPELLING_TAG);
  } catch {
    return false;
  }
};

export const addRuntimeRepelling = (ids: readonly string[], from: string): number => {
  for (const id of ids) {
    runtimeIds.add(normalize(id));
  }

  console.info(`[graves] '${from}' registered ${String(ids.length)} repelling entity id(s)`);

  return runtimeIds.size;
};

export const initRepelling = (): void => {
  config.server.extraRepellingEntities.subscribe((next) => {
    configIds = new Set(next.map(normalize));
  });
  system.run(() => {
    configIds = new Set(config.server.extraRepellingEntities.get().map(normalize));
  });
};
