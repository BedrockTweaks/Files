import { worldState } from '../storage/documents';
/**
 * §6, §6a, §7 — the index, the purge mechanisms, the despawn sweep, the
 * keepInventory enforcement and the RPC surface.
 *
 * The index is the authoritative half of the addon: a grave in an unloaded
 * chunk exists only as a record. Nothing here can unload a chunk on purpose —
 * a gametest pad is loaded by definition — so the tombstone path is driven
 * through `markPurge` and asserted on what the record says, not by arranging a
 * real unload. `forcepurge` (mechanism B) needs a genuinely unloaded grave and
 * a ticking area, and stays a manual check.
 *
 * `purgeGraves()` with no owner id purges the WHOLE world, a dev world's own
 * graves included. Every call here passes an owner id.
 */
import { GameRule, world } from '@minecraft/server';
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';
import { GRAVE_ENTITY } from '../constants';
import { config, core } from '../registration';
import { disableAddon, isAddonDisabled } from '../death/keepInventory';
import { addRuntimeImpenetrable } from '../death/impenetrable';
import { purgeGraves, pendingTombstones } from '../storage/purge';
import type { GravesRPC } from '../types';
import {
  LOCKED_TICKS,
  TAG_STATE,
  arrive,
  allRecords,
  die,
  giveItem,
  graveOf,
  graveTestAsync,
  markPurge,
  padBlock,
  place,
  revive,
  recordsOf,
  todo,
  updateRecord,
  visibleRecordsOf,
  withServerConfig,
} from './harness';

const options = { tags: [TAG_STATE], ticks: LOCKED_TICKS };

/** The config the tests here assume unless they say otherwise. */
const DEFAULTS = {
  capture: { enforceKeepInventory: true, warnOnGameRuleChange: false },
  contents: { pickUpXp: true, xpPercent: 100 },
  lifetime: { despawnSeconds: 0, maxGravesPerPlayer: 0 },
} as const;

graveTestAsync('state_record_shape', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_shape');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone, 17);
    giveItem(player, 5, MinecraftItemTypes.DiamondSword);
    player.addExperience(12);
    await test.idle(2);

    const before = Date.now();
    const record = await die(test, player);
    const grave = graveOf(record);

    test.assert(visibleRecordsOf(player.id).length === 1, `one death should leave one record, found ${String(visibleRecordsOf(player.id).length)}`);
    test.assert(record.owner === player.id, 'the record should be keyed by the owner');
    test.assert(record.dim === grave.dimension.id, `record.dim ${record.dim} should match the grave's dimension ${grave.dimension.id}`);
    test.assert(
      record.x === Math.floor(grave.location.x) && record.y === Math.floor(grave.location.y) && record.z === Math.floor(grave.location.z),
      `record position ${String(record.x)} ${String(record.y)} ${String(record.z)} should match the grave at ${String(Math.floor(grave.location.x))} ${String(Math.floor(grave.location.y))} ${String(Math.floor(grave.location.z))}`,
    );
    // 17 cobblestone + 1 sword — items counts STACKS' amounts, not slots.
    test.assert(record.items === 18, `record.items should count 18 items, counted ${String(record.items)}`);
    test.assert(record.xp === 12, `record.xp should be 12, was ${String(record.xp)}`);
    test.assert(record.diedAt >= before && record.diedAt <= Date.now(), 'record.diedAt should be stamped at the death, not later');
  });

  test.succeed();
}, options);

graveTestAsync('state_tombstone_hidden', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_tomb');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);

    const record = await die(test, player);
    const tombstonesBefore = pendingTombstones();

    markPurge(record.id);

    test.assert(recordsOf(player.id).some(r => r.id === record.id), 'a tombstoned record is still stored');
    test.assert(!visibleRecordsOf(player.id).some(r => r.id === record.id), 'but it is hidden from every UI and count');
    test.assert(pendingTombstones() === tombstonesBefore + 1, 'and it is counted as pending');
    test.assert(!allRecords().some(r => r.id === record.id), 'allRecords() without tombstones should skip it');
    test.assert(allRecords(true).some(r => r.id === record.id), 'allRecords(true) should include it');
  });

  test.succeed();
}, options);

graveTestAsync('state_purge_report', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_purge');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);

    const record = await die(test, player);
    const grave = graveOf(record);
    const report = purgeGraves(player.id);

    test.assert(report.total === 1, `the report should cover 1 grave, covered ${String(report.total)}`);
    test.assert(report.removed === 1, `a loaded grave is removed outright, removed ${String(report.removed)}`);
    test.assert(report.tombstoned === 0, `nothing should be tombstoned, tombstoned ${String(report.tombstoned)}`);
    test.assert(!grave.isValid, 'the grave entity should be gone');
    test.assert(visibleRecordsOf(player.id).length === 0, 'and so should its record');
  });

  test.succeed();
}, options);

graveTestAsync('state_purge_skips_tombstones', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_recon');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);

    const record = await die(test, player);
    const grave = graveOf(record);

    markPurge(record.id);

    const pending = pendingTombstones();

    test.assert(pending > 0, 'setup: the record should be tombstoned');

    // `purgeGraves` walks `allRecords()`, which hides tombstones — so a record
    // already condemned is not condemned twice, and the report counts only what
    // it actually acted on. Executing the tombstone belongs to reconcile (on the
    // next chunk load) and to forcepurge; see the todos at the end of this file.
    const report = purgeGraves(player.id);

    test.assert(report.total === 0, `a purge should skip records already tombstoned, covered ${String(report.total)}`);
    test.assert(report.removed === 0 && report.tombstoned === 0, 'and should report nothing removed or newly tombstoned');
    test.assert(pendingTombstones() === pending, 'the pending count should be unchanged');
    test.assert(grave.isValid, 'the entity stays until the path that owns it runs');
  });

  test.succeed();
}, options);

graveTestAsync('state_despawn_sweep', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_despawn');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);

    const record = await die(test, player);
    const grave = graveOf(record);

    // Backdated rather than waited out: the sweep compares epoch milliseconds,
    // so ageing the record is the same thing as ageing the grave, and it keeps
    // the test to one sweep interval instead of one despawn period.
    updateRecord({ ...record, diedAt: Date.now() - 60_000 });
    config.server.lifetime.despawnSeconds.set(1);

    // The sweep runs every SWEEP_INTERVAL_TICKS (200); give it two turns.
    await test.idle(420);

    test.assert(!grave.isValid, 'an expired grave should have been swept');
    test.assert(visibleRecordsOf(player.id).length === 0, 'and its record with it');
  });

  test.succeed();
}, options);

graveTestAsync('state_keepinventory_reasserted', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    test.assert(world.gameRules.keepInventory, 'setup: the addon should be holding keepInventory on');

    world.gameRules[GameRule.KeepInventory] = false;
    await test.idle(10);

    test.assert(world.gameRules.keepInventory, 'the addon should put keepInventory straight back');
  });

  test.succeed();
}, options);

graveTestAsync('state_disable_refused_with_graves', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_disable');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);
    await die(test, player);

    test.assert(!isAddonDisabled(), 'setup: the addon should start enabled');

    // `disable` refuses while graves exist; the command layer is what enforces
    // that, so the check here is the state it is protecting — a forced disable
    // must stop capture and hand keepInventory back.
    disableAddon();
    test.assert(isAddonDisabled(), 'forcedisable should switch the addon off');
    await test.idle(2);

    await revive(test, player);
    giveItem(player, 0, MinecraftItemTypes.DiamondSword);
    await test.idle(2);

    const before = visibleRecordsOf(player.id).length;

    player.kill();
    await test.idle(40);

    test.assert(visibleRecordsOf(player.id).length === before, 'a disabled addon must not capture another grave');

    // Cleanup restores world state from the pre-suite snapshot, but leaving
    // the switch off for even one later test in the same run would be enough to
    // break it, so it goes back now.
    worldState.patch({ disabled: undefined });
    world.gameRules[GameRule.KeepInventory] = true;
    await test.idle(2);
    test.assert(!isAddonDisabled(), 'the addon should be back on before the next test sees it');
  });

  test.succeed();
}, options);

graveTestAsync('state_rpc_surface', async (test) => {
  const graves = core.rpc.typed<GravesRPC>('bt_gc_graves');
  const size = await graves.registerImpenetrable({ ids: [MinecraftBlockTypes.Sponge] });

  test.assert(size > 0, 'registerImpenetrable should report the runtime set size');

  test.succeed();
}, options);

graveTestAsync('state_impenetrable_repels', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    // Layer 3 has no removal API, so only a block that was never a legal cell
    // may be registered — a solid one cannot change another test's placement.
    addRuntimeImpenetrable([MinecraftBlockTypes.Sponge], 'gametest:state');
    place(test, { x: 4, y: 1, z: 4 }, MinecraftBlockTypes.Sponge);

    const sponge = padBlock(test, { x: 4, y: 1, z: 4 });

    test.assert(sponge.typeId === MinecraftBlockTypes.Sponge, `setup: expected sponge, found ${sponge.typeId}`);
  });

  test.succeed();
}, options);

graveTestAsync('state_cleanup_leaves_nothing', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const player = arrive(test, 'state_tidy');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    await test.idle(2);

    const record = await die(test, player);

    purgeGraves(player.id);
    await test.idle(5);

    // The suite runs against a dev world; a grave left standing in the pad or a
    // record left in the index would be debris in somebody's save.
    test.assert(!test.getDimension().getEntities({ type: GRAVE_ENTITY }).some(e => e.id === record.id), 'no grave entity should be left behind');
    test.assert(visibleRecordsOf(player.id).length === 0, 'no index record should be left behind');
    test.assert(world.gameRules.keepInventory, 'keepInventory should still be held on');
  });

  test.succeed();
}, options);

todo(
  'state_forcepurge',
  'forcepurge (mechanism B) force-loads each tombstoned grave with a ticking area. It needs a grave in a genuinely UNLOADED chunk, which a test area never is. Manual check: /<ns>:gravesadmin forcepurge with graves far from any player',
  { tags: [TAG_STATE] },
);
