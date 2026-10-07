import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { graveSlotForPlayerSlot } from '../constants';
import { isRepelling, REPELLING_TAG } from '../death/repelling';
import { solvePlacement } from '../death/placement';
import { graveContainer } from '../inventory';
import { updateGraveContainer } from '../open/container';
import { core } from '../registration';
import { graveDocuments, graveDirectory } from '../storage/documents';
import { reconcileGrave } from '../storage/reconcile';
import type { GravesRPC } from '../types';
import {
  LOCKED_TICKS, TAG_STATE, arrive, die, giveItem, graveOf, graveTestAsync,
  must, padWorld, revive, withServerConfig,
} from './harness';

const options = { tags: [TAG_STATE], ticks: LOCKED_TICKS };
const defaults = {
  contents: { pickUpXp: true, xpPercent: 100 },
  lifetime: { despawnSeconds: 0, maxGravesPerPlayer: 0 },
};

graveTestAsync('documents_recover_and_purge', async (test) => {
  await withServerConfig(test, defaults, async () => {
    const player = arrive(test, 'documents_recover');

    giveItem(player, 0, MinecraftItemTypes.Diamond, 7);
    await test.idle(2);
    const record = await die(test, player);
    const entity = graveOf(record);
    const document = graveDocuments.for(entity);
    const saved = must(document.get(), 'the grave must have an entity document');

    test.assert(saved.owner === player.id && saved.items === 7, 'entity documents preserve ownership and item totals');
    graveDirectory.patch({ records: { [record.id]: undefined } });
    reconcileGrave(entity);
    test.assert(graveDirectory.get()?.records[record.id]?.items === 7, 'a loaded entity restores its directory entry');
    graveDirectory.patch({ records: { [record.id]: { purge: true } } });
    reconcileGrave(entity);
    test.assert(!entity.isValid, 'reconciliation removes a tombstoned entity');
    test.assert(graveDirectory.get()?.records[record.id] === undefined, 'purge removes directory metadata');
    await test.idle(1);
    test.assert(document.get() === undefined, 'purge removes the entity document');
  });
  test.succeed();
}, options);

graveTestAsync('documents_container_totals_and_xp_once', async (test) => {
  await withServerConfig(test, defaults, async () => {
    const player = arrive(test, 'documents_loot');

    giveItem(player, 0, MinecraftItemTypes.Diamond, 7);
    giveItem(player, 1, MinecraftItemTypes.IronIngot, 3);
    player.addExperience(15);
    await test.idle(2);
    const record = await die(test, player);

    await revive(test, player);
    const entity = graveOf(record);
    const container = must(graveContainer(entity), 'the grave must have a logical container');
    const event = { host: entity, player, container };

    container.setItem(graveSlotForPlayerSlot(0), undefined);
    updateGraveContainer(event);
    await test.idle(2);
    test.assert(graveDocuments.for(entity).get()?.items === 3, 'partial looting updates the entity document');
    test.assert(graveDirectory.get()?.records[record.id]?.items === 3, 'partial looting updates the directory');
    test.assert(player.getTotalXp() === 0, 'partial looting keeps XP in the grave');
    container.setItem(graveSlotForPlayerSlot(1), undefined);
    updateGraveContainer(event);
    updateGraveContainer(event);
    await test.idle(2);
    test.assert(player.getTotalXp() === record.xp, 'overlapping slot and close callbacks grant XP exactly once');
    test.assert(!entity.isValid, 'the final item removes the grave');
  });
  test.succeed();
}, options);

graveTestAsync('repelling_config_and_placement', async (test) => {
  await withServerConfig(test, { extraRepellingEntities: ['pig'] }, async () => {
    const player = arrive(test, 'repelling_config');
    const at = padWorld(test, { x: 8, y: 1, z: 8 });
    const entity = test.getDimension().spawnEntity('minecraft:pig', { x: at.x + 0.5, y: at.y, z: at.z + 0.5 });

    try {
      test.assert(isRepelling(entity), 'config normalizes unqualified entity ids');
      const placement = solvePlacement(test.getDimension(), padWorld(test, { x: 8, y: 6, z: 8 }), player);

      test.assert(placement.x !== at.x || placement.z !== at.z, 'the solver avoids the configured repeller');
    } finally {
      entity.remove();
    }
  });
  test.succeed();
}, options);

graveTestAsync('repelling_tag_and_rpc', async (test) => {
  const entity = test.getDimension().spawnEntity('minecraft:sheep', padWorld(test, { x: 8, y: 1, z: 8 }));

  try {
    entity.addTag(REPELLING_TAG);
    test.assert(isRepelling(entity), 'an entity tag opts into repelling');
    entity.removeTag(REPELLING_TAG);
    const rpc = core.rpc.typed<GravesRPC>('bt_gc_graves');
    const count = await rpc.registerRepelling({ ids: ['sheep'] });
    const repeated = await rpc.registerRepelling({ ids: ['minecraft:sheep'] });

    test.assert(count > 0 && repeated === count, 'RPC normalizes and deduplicates entity ids');
    test.assert(isRepelling(entity), 'RPC registration reaches the placement policy');
  } finally {
    if (entity.isValid) {
      entity.remove();
    }
  }

  test.succeed();
}, options);
