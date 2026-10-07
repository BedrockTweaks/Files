import { graveDocuments } from '../storage/documents';
/**
 * §3c — death capture.
 *
 * The spike the port never got to run in game (plan §10): keepInventory is
 * forced on, so at `entityDie` the player's container, equipment and XP are
 * all still populated, and the addon reads them there instead of vacuuming
 * drops. These tests are the proof — or the place where that assumption dies.
 *
 * Every test here goes through `die(test, player)`, which kills and then looks
 * for a NEW index record rather than the first one, so a test that dies twice
 * keeps asserting against the right grave. A simulated player respawns at the
 * world spawn, not in the pad, so anything that uses one after a death goes
 * through `revive` first.
 *
 * These are the tests that genuinely need simulated players. That costs the
 * occasional framework `InvalidEntityError ... at loadPlayerValues` when one is
 * torn down before its own `playerSpawn` handler has run; it is noise from a
 * stale handle inside `@bedrock-core/server-runtime`, not a fault here, and the
 * bodies below are long enough that it rarely fires.
 */
import { Difficulty, EntityDamageCause, EquipmentSlot, GameMode } from '@minecraft/server';
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';
import { GRAVE_INVENTORY_SIZE, PLAYER_CONTAINER_SLOTS, graveSlotForPlayerSlot } from '../constants';
import { EQUIP_SLOTS, graveContainer } from '../inventory';
import {
  LOCKED_TICKS,
  TAG_CAPTURE,
  arrive,
  die,
  dieMaybe,
  equipmentOf,
  expectStack,
  giveItem,
  graveOf,
  graveTestAsync,
  inventoryOf,
  must,
  padAt,
  revive,
  todo,
  visibleRecordsOf,
  withDifficulty,
  withServerConfig,
} from './harness';

const options = { tags: [TAG_CAPTURE], ticks: LOCKED_TICKS };

// The unlocked tests below are config-independent on purpose: they give no xp
// and hold no graves, so a neighbour's xpPercent or maxGravesPerPlayer cannot
// reach them, and they stay parallel.
const slowOptions = options;

graveTestAsync('capture_container_slots', async (test) => {
  const player = arrive(test, 'grave_slots');
  const marked: [number, string][] = [[0, MinecraftItemTypes.DiamondSword], [8, MinecraftItemTypes.GoldenApple], [35, MinecraftItemTypes.Cobblestone]];
  const given = marked.map(([slot, id]) => [slot, giveItem(player, slot, id, id === MinecraftItemTypes.Cobblestone ? 17 : 1)] as const);

  const record = await die(test, player);
  const container = must(graveContainer(graveOf(record)), 'the grave has no container component');

  test.assert(container.size >= GRAVE_INVENTORY_SIZE, `the grave container is ${String(container.size)} slots, wanted at least ${String(GRAVE_INVENTORY_SIZE)}`);

  for (const [slot, stack] of given) {
    const graveSlot = graveSlotForPlayerSlot(slot);

    expectStack(test, container.getItem(graveSlot), stack, `grave slot ${String(graveSlot)} mirrors player slot ${String(slot)}`);
  }

  const left = inventoryOf(player);

  for (const [slot] of given) {
    expectStack(test, left.getItem(slot), undefined, `player slot ${String(slot)} was emptied`);
  }

  test.succeed();
}, options);

graveTestAsync('capture_equipment_slots', async (test) => {
  const player = arrive(test, 'grave_equip');
  const worn: [EquipmentSlot, string][] = [
    [EquipmentSlot.Head, MinecraftItemTypes.DiamondHelmet],
    [EquipmentSlot.Chest, MinecraftItemTypes.IronChestplate],
    [EquipmentSlot.Legs, MinecraftItemTypes.GoldenLeggings],
    [EquipmentSlot.Feet, MinecraftItemTypes.ChainmailBoots],
    [EquipmentSlot.Offhand, MinecraftItemTypes.Shield],
  ];
  const equippable = equipmentOf(player);

  for (const [slot, id] of worn) {
    equippable.setEquipment(slot, giveItem(player, 0, id));
  }

  // giveItem staged each one through slot 0; clear it so only equipment dies.
  inventoryOf(player).setItem(0, undefined);

  const record = await die(test, player);
  const container = must(graveContainer(graveOf(record)), 'the grave has no container component');

  for (let i = 0; i < EQUIP_SLOTS.length; i++) {
    const slot = PLAYER_CONTAINER_SLOTS + i;
    const [, id] = worn[i];

    test.assert(
      container.getItem(slot)?.typeId === id,
      `grave slot ${String(slot)} should hold ${id} for ${EQUIP_SLOTS[i]}, found ${String(container.getItem(slot)?.typeId)}`,
    );
    test.assert(equipmentOf(player).getEquipment(EQUIP_SLOTS[i]) === undefined, `${EQUIP_SLOTS[i]} should have been taken off the player`);
  }

  test.succeed();
}, options);

graveTestAsync('capture_xp_percent', async (test) => {
  await withServerConfig(test, { contents: { pickUpXp: true, xpPercent: 50 } }, async () => {
    const player = arrive(test, 'grave_xp');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    player.addExperience(100);
    await test.idle(2);

    const banked = player.getTotalXp();

    test.assert(banked === 100, `setup: expected 100 xp on the player, found ${String(banked)}`);

    const record = await die(test, player);

    test.assert(record.xp === 50, `xpPercent 50 of 100 xp should bank 50, banked ${String(record.xp)}`);
    test.assert(player.getTotalXp() === 0, `the player's xp should have been reset, found ${String(player.getTotalXp())}`);
  });

  test.succeed();
}, slowOptions);

graveTestAsync('capture_xp_disabled', async (test) => {
  await withServerConfig(test, { contents: { pickUpXp: false, xpPercent: 100 } }, async () => {
    const player = arrive(test, 'grave_noxp');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);
    player.addExperience(100);
    await test.idle(2);

    const record = await die(test, player);

    test.assert(record.xp === 0, `pickUpXp off should bank no xp, banked ${String(record.xp)}`);

    // Whether Bedrock's own keepInventory keeps the levels is the engine's
    // business; what matters is that the addon did not take them.
    console.info(`[graves:test] pickUpXp off left the player with ${String(player.getTotalXp())} xp`);
  });

  test.succeed();
}, slowOptions);

graveTestAsync('capture_nothing_to_take', async (test) => {
  const player = arrive(test, 'grave_empty');

  // No items, no xp — the early return. A grave holding nothing is a bug.
  const record = await dieMaybe(test, player);

  test.assert(record === undefined, 'a death with nothing to bury must not make a grave');
  test.assert(visibleRecordsOf(player.id).length === 0, 'and must not leave an index record either');
  test.succeed();
}, options);

graveTestAsync('capture_spectator_skipped', async (test) => {
  const player = arrive(test, 'grave_ghost', undefined, GameMode.Spectator);

  giveItem(player, 0, MinecraftItemTypes.DiamondSword);
  await test.idle(2);

  const record = await dieMaybe(test, player);

  test.assert(record === undefined, 'a spectator cannot drop, so it cannot bury either');
  test.succeed();
}, options);

graveTestAsync('capture_cause_and_killer', async (test) => {
  // Easy, because a hostile mob cannot be spawned into a peaceful world at all
  // — and peaceful is what a headless server runs at by default.
  await withDifficulty(test, Difficulty.Easy, async () => {
    const player = arrive(test, 'grave_slain');
    const killer = test.spawn(MinecraftEntityTypes.Zombie, padAt(test, { x: 12, y: 1, z: 12 }));

    giveItem(player, 0, MinecraftItemTypes.DiamondSword);
    await test.idle(2);

    const already = new Set(visibleRecordsOf(player.id).map(r => r.id));

    // Scripted rather than fought: a real zombie decides for itself when to
    // swing, and a test that waits on mob AI is a test that fails on a slow tick.
    player.applyDamage(1000, { cause: EntityDamageCause.entityAttack, damagingEntity: killer });
    await test.idle(40);

    const record = must(visibleRecordsOf(player.id).find(r => !already.has(r.id)), 'a slain player should still get a grave');

    test.assert(record.killer === MinecraftEntityTypes.Zombie, `record.killer should be the zombie, found ${String(record.killer)}`);
    test.assert(record.cause !== undefined, 'record.cause should carry the damage cause');

    const grave = graveOf(record);

    test.assert(graveDocuments.for(grave).get()?.killer === record.killer, 'the grave entity should carry the same killer as the record');
    test.assert(graveDocuments.for(grave).get()?.cause === record.cause, 'the grave entity should carry the same cause as the record');
  });

  test.succeed();
}, options);

graveTestAsync('capture_cap_drop_oldest', async (test) => {
  await withServerConfig(test, { lifetime: { maxGravesPerPlayer: 1, onLimitReached: 'drop_oldest' } }, async () => {
    const player = arrive(test, 'grave_cap_drop');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);

    const first = await die(test, player);

    await revive(test, player);
    giveItem(player, 0, MinecraftItemTypes.GoldenApple);

    const second = await die(test, player);
    const held = visibleRecordsOf(player.id);

    test.assert(held.length === 1, `the cap is 1 grave, found ${String(held.length)}`);
    test.assert(held[0].id === second.id, 'the grave kept should be the NEW one');
    test.assert(held[0].id !== first.id, 'the oldest grave should have been dropped');
  });

  test.succeed();
}, slowOptions);

graveTestAsync('capture_cap_block_new', async (test) => {
  await withServerConfig(test, { lifetime: { maxGravesPerPlayer: 1, onLimitReached: 'block_new' } }, async () => {
    const player = arrive(test, 'grave_cap_block');

    giveItem(player, 0, MinecraftItemTypes.Cobblestone);

    const first = await die(test, player);

    await revive(test, player);

    const kept = giveItem(player, 0, MinecraftItemTypes.GoldenApple);
    const second = await dieMaybe(test, player);

    test.assert(second === undefined, 'block_new must refuse the second grave');

    const held = visibleRecordsOf(player.id);

    test.assert(held.length === 1 && held[0].id === first.id, 'the first grave should be untouched');

    // The whole point of refusing: keepInventory is on, so nothing was lost.
    expectStack(test, inventoryOf(player).getItem(0), kept, 'a blocked grave leaves the items on the player');
  });

  test.succeed();
}, slowOptions);

todo(
  'capture_toast_message',
  'showDeathToast on/off changes whether the owner is messaged, and the fallback/floating variants say so — needs a way to observe chat, which no script API offers; keep as a manual check or delete',
  { tags: [TAG_CAPTURE] },
);
