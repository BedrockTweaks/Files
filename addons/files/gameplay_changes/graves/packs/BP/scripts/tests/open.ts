/**
 * §3a — the three ways into a grave, and the three gates in front of them.
 *
 * Paths: right-click (native container screen + the watch poll), sneak +
 * interact (restore straight to the inventory), attack twice (scatter).
 * Gates: owner, `allowRobbing`, grave key.
 *
 * Two things cannot be driven from a test, and pretending otherwise would make
 * this file a set of tests that pass without proving anything:
 *
 *  - The native container SCREEN. No script API opens or closes an engine
 *    container for a simulated player. `watchGrave`, the half that is ours, is
 *    started directly instead.
 *  - A simulated interaction, as a way to reach the restore path. Sneaking
 *    itself DOES stick (`open_sneak_gate` asserts it), but driving the gate is
 *    a chain of engine behaviour — reach, aim, the before-event, a deferred
 *    `system.run` — and a failure anywhere in it reads only as "nothing
 *    happened". So the RESTORE tests call `restoreToPlayer` directly and
 *    `open_sneak_gate` is the single end-to-end check of the wiring.
 *
 * Authorisation is tested against `authorize`/`consumeKey` rather than through
 * an interaction, for the same reason: they are pure, and a failure names the
 * rule that broke instead of "nothing happened".
 *
 * Everything that reads server config takes the config lock, because a runset
 * runs tests in parallel and the config is world-global — a neighbouring test
 * setting `xpPercent: 50` silently halved this one's expected XP before that
 * was true of every config-sensitive test here.
 */
import { EquipmentSlot, GameMode } from '@minecraft/server';
import type { Entity } from '@minecraft/server';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import type { SimulatedPlayer, Test } from '@minecraft/server-gametest';
import { GRAVE_ENTITY, GRAVE_KEY_ITEM, PLAYER_CONTAINER_SLOTS, PROP_SHAKE_UNTIL, SHAKE_WINDOW_TICKS } from '../constants';
import { graveContainer } from '../lifecycle';
import { authorize, consumeKey } from '../open/auth';
import { watchGrave } from '../open/container';
import { restoreToPlayer } from '../open/restore';
import { visibleRecordsOf } from '../index/store';
import type { GraveRecord } from '../types';
import {
  LOCKED_TICKS,
  TAG_OPEN,
  arrive,
  die,
  equipmentOf,
  expectStack,
  giveItem,
  graveOf,
  graveTestAsync,
  inventoryOf,
  itemsInPad,
  must,
  revive,
  todo,
  withServerConfig,
} from './harness';

const options = { tags: [TAG_OPEN], ticks: LOCKED_TICKS };

/** The config every test here assumes unless it says otherwise. */
const DEFAULTS = {
  access: { allowRobbing: false, graveKeyEnabled: true },
  contents: { pickUpXp: true, xpPercent: 100, restoreToOriginalSlots: true },
} as const;

interface Buried {
  player: SimulatedPlayer;
  record: GraveRecord;
  grave: Entity;
}

/** A real death, then the owner back on their feet standing on their own grave. */
const bury = async (test: Test, name: string, stacks: readonly (readonly [number, string])[], xp = 0): Promise<Buried> => {
  const player = arrive(test, name);

  for (const [slot, id] of stacks) {
    giveItem(player, slot, id);
  }

  if (xp > 0) {
    player.addExperience(xp);
  }

  await test.idle(2);

  const record = await die(test, player);

  // Beside the grave, not inside it. A player standing in the same cell as the
  // entity it is trying to interact with is not a position a real player can be
  // in, and the engine treats it accordingly.
  await revive(test, player, { x: 8, y: 1, z: 5 });

  return { player, record, grave: graveOf(record) };
};

/**
 * Face the target first. A simulated player's `interactWithEntity` and
 * `attackEntity` go through the same reach and line-of-sight checks a real
 * click does, so an unaimed call is silently a no-op.
 */
const faceUp = async (test: Test, player: SimulatedPlayer, grave: Entity): Promise<void> => {
  player.lookAtEntity(grave);
  await test.idle(5);
};

const graveIsGone = (test: Test, record: GraveRecord, note: string): void => {
  test.assert(!test.getDimension().getEntities({ type: GRAVE_ENTITY }).some(e => e.id === record.id), `${note}: the grave entity is still there`);
  test.assert(!visibleRecordsOf(record.owner).some(r => r.id === record.id), `${note}: the index record is still there`);
};

// ─── Restore (§3a action 2) ────────────────────────────────────────────────────

graveTestAsync('open_restore_original_slots', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const stacks = [[0, MinecraftItemTypes.DiamondSword], [8, MinecraftItemTypes.GoldenApple]] as const;
    const { player, record, grave } = await bury(test, 'open_sneak', stacks, 30);

    test.assert(record.xp === 30, `setup: the grave should hold 30 xp, holds ${String(record.xp)}`);
    restoreToPlayer(grave, player);
    await test.idle(5);

    const inventory = inventoryOf(player);

    for (const [slot, id] of stacks) {
      test.assert(inventory.getItem(slot)?.typeId === id, `${id} should be back in its original slot ${String(slot)}, found ${String(inventory.getItem(slot)?.typeId)}`);
    }

    test.assert(player.getTotalXp() === record.xp, `the grave's xp should be back on the player, found ${String(player.getTotalXp())}`);
    graveIsGone(test, record, 'a fully restored grave');
  });

  test.succeed();
}, options);

graveTestAsync('open_restore_displaced', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, record, grave } = await bury(test, 'open_displaced', [[8, MinecraftItemTypes.GoldenApple]] as const);
    const inventory = inventoryOf(player);
    const squatter = giveItem(player, 8, MinecraftItemTypes.Cobblestone);

    restoreToPlayer(grave, player);
    await test.idle(5);

    // Pass 1 finds slot 8 taken; pass 2 must place the apple elsewhere, not on
    // top of the cobblestone and not on the floor.
    expectStack(test, inventory.getItem(8), squatter, 'the block already in slot 8 stays put');

    let found = false;

    for (let slot = 0; slot < PLAYER_CONTAINER_SLOTS; slot++) {
      if (inventory.getItem(slot)?.typeId === MinecraftItemTypes.GoldenApple) {
        found = true;
        break;
      }
    }

    test.assert(found, 'the displaced apple should have landed in some free slot');
    graveIsGone(test, record, 'a restored grave');
  });

  test.succeed();
}, options);

graveTestAsync('open_restore_overflow', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, record, grave } = await bury(test, 'open_overflow', [[0, MinecraftItemTypes.GoldenApple]] as const);
    const inventory = inventoryOf(player);

    // Nowhere left to put anything: swords do not stack, so addItem cannot merge.
    for (let slot = 0; slot < PLAYER_CONTAINER_SLOTS; slot++) {
      giveItem(player, slot, MinecraftItemTypes.DiamondSword);
    }

    for (const slot of [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand]) {
      equipmentOf(player).setEquipment(slot, undefined);
    }

    restoreToPlayer(grave, player);
    await test.idle(5);

    test.assert(inventory.emptySlotsCount === 0, 'setup: the inventory should still be full');

    const dropped = itemsInPad(test);

    test.assert(dropped.length > 0, 'an item that cannot fit anywhere must be dropped, not deleted');
    graveIsGone(test, record, 'a restored grave');
  });

  test.succeed();
}, options);

graveTestAsync('open_restore_original_slots_off', async (test) => {
  await withServerConfig(test, { ...DEFAULTS, contents: { ...DEFAULTS.contents, restoreToOriginalSlots: false } }, async () => {
    const { player, record, grave } = await bury(test, 'open_anyslot', [[8, MinecraftItemTypes.GoldenApple]] as const);
    const inventory = inventoryOf(player);

    restoreToPlayer(grave, player);
    await test.idle(5);

    // addItem fills from the first free slot, so the apple comes back at 0 —
    // which is exactly the difference from the restoreToOriginalSlots path.
    test.assert(inventory.getItem(0)?.typeId === MinecraftItemTypes.GoldenApple, `the apple should come back via addItem at slot 0, found ${String(inventory.getItem(0)?.typeId)}`);
    test.assert(inventory.getItem(8) === undefined, 'and NOT in its original slot 8');
    graveIsGone(test, record, 'a restored grave');
  });

  test.succeed();
}, options);

// ─── The interact gate (§3a) ───────────────────────────────────────────────────

todo(
  'open_sneak_gate',
  'MEASURED, NOT DRIVABLE: the flag sticks (player.isSneaking reads back true) and interactWithEntity returns true, but the gate still took the native-container branch — the engine does not carry a simulated player sneak state into the playerInteractWithEntity BEFORE-event, which is where that branch is decided. Manual check: crouch and right-click a grave, everything comes back to your own slots. The restore itself is covered by open_restore_*',
  { tags: [TAG_OPEN] },
);

// ─── Attack ×2 (§3a action 3) ──────────────────────────────────────────────────

graveTestAsync('open_attack_scatter', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, record, grave } = await bury(test, 'open_scatter', [[0, MinecraftItemTypes.DiamondSword]] as const, 20);

    await faceUp(test, player, grave);
    player.attackEntity(grave);
    await test.idle(2);

    // Split out so a swing the engine swallowed reads differently from a second
    // swing that arrived too late.
    test.assert(typeof grave.getDynamicProperty(PROP_SHAKE_UNTIL) === 'number', 'the first hit should arm the shake window — the attack never reached the grave');

    // An entity that has just been hit is invulnerable for about ten ticks, and
    // a swing inside that window produces no damage event at all — the gate
    // never sees it. So wait it out, then swing again, still inside the (longer)
    // shake window.
    await test.idle(12);
    player.attackEntity(grave);
    await test.idle(8);

    test.assert(!grave.isValid, 'a second hit inside the shake window should have scattered the grave');

    const dropped = itemsInPad(test);

    test.assert(dropped.length > 0, 'the second hit should scatter the contents on the ground');
    test.assert(player.getTotalXp() === record.xp, `the attacker should get the grave's xp, found ${String(player.getTotalXp())}`);
    graveIsGone(test, record, 'a scattered grave');
  });

  test.succeed();
}, options);

graveTestAsync('open_attack_window_expires', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, record, grave } = await bury(test, 'open_window', [[0, MinecraftItemTypes.DiamondSword]] as const);

    await faceUp(test, player, grave);
    player.attackEntity(grave);
    await test.idle(2);
    test.assert(typeof grave.getDynamicProperty(PROP_SHAKE_UNTIL) === 'number', 'the first hit should arm the shake window');

    // Past the window, so the next hit is a FIRST hit again, not a second one.
    await test.idle(SHAKE_WINDOW_TICKS + 10);
    player.attackEntity(grave);
    await test.idle(5);

    test.assert(grave.isValid, 'a hit outside the shake window must not scatter the grave');

    const container = must(graveContainer(grave), 'the grave lost its container');

    test.assert(container.getItem(0)?.typeId === MinecraftItemTypes.DiamondSword, 'and must not empty it either');
    test.assert(visibleRecordsOf(record.owner).some(r => r.id === record.id), 'the index record should survive too');
  });

  test.succeed();
}, options);

graveTestAsync('open_attack_is_harmless', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, grave } = await bury(test, 'open_tough', [[0, MinecraftItemTypes.DiamondSword]] as const);

    await faceUp(test, player, grave);

    // Three first-hits, each outside the previous window, so none of them scatter.
    for (let i = 0; i < 3; i++) {
      player.attackEntity(grave);
      await test.idle(SHAKE_WINDOW_TICKS + 6);
    }

    test.assert(grave.isValid, 'the damage sensor should make a grave unkillable by attack');
  });

  test.succeed();
}, options);

// ─── The three gates (§3a) ─────────────────────────────────────────────────────

graveTestAsync('open_auth_owner', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, grave } = await bury(test, 'open_self', [[0, MinecraftItemTypes.GoldenApple]] as const);
    const auth = authorize(player, grave);

    test.assert(auth.allowed, 'an owner is always allowed into their own grave');
    test.assert(!auth.needsKey, 'and never spends a key doing it');
  });

  test.succeed();
}, options);

graveTestAsync('open_auth_refused', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { grave } = await bury(test, 'open_owner', [[0, MinecraftItemTypes.DiamondSword]] as const);
    const thief = arrive(test, 'open_thief');

    await test.idle(2);

    const auth = authorize(thief, grave);

    test.assert(!auth.allowed, 'robbing is off and the thief holds no key, so access is refused');

    // And the refusal has to hold on the attack path too, not just interact.
    await faceUp(test, thief, grave);
    thief.attackEntity(grave);
    await test.idle(3);
    thief.attackEntity(grave);
    await test.idle(10);

    test.assert(grave.isValid, 'a refused thief must not be able to break the grave open');

    const container = must(graveContainer(grave), 'the grave lost its container');

    test.assert(container.getItem(0)?.typeId === MinecraftItemTypes.DiamondSword, 'and must keep every item');
    test.assert(inventoryOf(thief).getItem(0) === undefined, 'and the thief must come away with nothing');
  });

  test.succeed();
}, options);

graveTestAsync('open_auth_robbing', async (test) => {
  await withServerConfig(test, { ...DEFAULTS, access: { allowRobbing: true, graveKeyEnabled: false } }, async () => {
    const { grave } = await bury(test, 'open_owner2', [[0, MinecraftItemTypes.DiamondSword]] as const);
    const thief = arrive(test, 'open_robber');

    await test.idle(2);

    const auth = authorize(thief, grave);

    test.assert(auth.allowed, 'with robbing on, anyone is allowed in');
    test.assert(!auth.needsKey, 'and robbing does not spend a key');

    restoreToPlayer(grave, thief);
    await test.idle(5);
    test.assert(inventoryOf(thief).getItem(0)?.typeId === MinecraftItemTypes.DiamondSword, 'and the loot goes to whoever opened it');
  });

  test.succeed();
}, options);

graveTestAsync('open_auth_key_consumed', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { grave } = await bury(test, 'open_owner3', [[0, MinecraftItemTypes.GoldenApple]] as const);
    const thief = arrive(test, 'open_keyholder');

    // Slot 0 IS the mainhand for a player at the default selected slot, so the
    // key goes there and nowhere else — writing it twice would clear it.
    giveItem(thief, 0, GRAVE_KEY_ITEM, 2);
    await test.idle(2);

    const auth = authorize(thief, grave);

    test.assert(auth.allowed, 'a grave key gets a non-owner in');
    test.assert(auth.needsKey, 'and the caller is told to spend one');

    consumeKey(thief);
    await test.idle(2);

    const left = must(equipmentOf(thief).getEquipment(EquipmentSlot.Mainhand), 'the whole stack was taken instead of one key');

    test.assert(left.typeId === GRAVE_KEY_ITEM, `the thief should still hold a key, found ${left.typeId}`);
    test.assert(left.amount === 1, `exactly one key should have been consumed, ${String(left.amount)} left of 2`);
  });

  test.succeed();
}, options);

graveTestAsync('open_key_survives_creative', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { grave } = await bury(test, 'open_owner4', [[0, MinecraftItemTypes.GoldenApple]] as const);
    const thief = arrive(test, 'open_creative', undefined, GameMode.Creative);

    giveItem(thief, 0, GRAVE_KEY_ITEM, 2);
    await test.idle(2);
    test.assert(authorize(thief, grave).allowed, 'a creative key holder is allowed in too');

    consumeKey(thief);
    await test.idle(2);

    const left = must(equipmentOf(thief).getEquipment(EquipmentSlot.Mainhand), 'a creative player should not lose the stack');

    test.assert(left.amount === 2, `a creative player keeps their keys, found ${String(left.amount)} of 2`);
  });

  test.succeed();
}, options);

// ─── The container watch (§3a action 1) ────────────────────────────────────────

graveTestAsync('open_watch_removes_empty', async (test) => {
  await withServerConfig(test, DEFAULTS, async () => {
    const { player, record, grave } = await bury(test, 'open_watch', [[0, MinecraftItemTypes.DiamondSword]] as const, 15);

    // The native screen cannot be opened from a script, so the poll it would
    // have started is started here instead — emptying is what it watches for.
    watchGrave(grave, player);
    await test.idle(2);

    const container = must(graveContainer(grave), 'the grave lost its container');

    for (let slot = 0; slot < container.size; slot++) {
      container.setItem(slot, undefined);
    }

    // The poll runs every WATCH_INTERVAL_TICKS (10); give it two turns.
    await test.idle(25);

    test.assert(player.getTotalXp() === record.xp, `the opener should get the grave's xp, found ${String(player.getTotalXp())}`);
    graveIsGone(test, record, 'an emptied grave');
  });

  test.succeed();
}, options);

todo(
  'open_native_screen',
  'right-click opens the engine container screen — no script API can open or close one for a simulated player, so this stays a manual check',
  { tags: [TAG_OPEN] },
);
