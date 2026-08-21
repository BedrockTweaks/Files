/**
 * §3b — the placement solver.
 *
 * The highest-value group in the suite: `solvePlacement` is the rewrite of the
 * Java pack's 19 recursive functions into two engine raycasts, and it is the
 * one part of the addon that can be tested WITHOUT a death. Build terrain in
 * the pad, call `solvePlacement(dimension, start, owner)` directly, assert the
 * coordinates it returns. No `entityDie`, no timing, no simulated corpse.
 *
 * Solver coordinates are absolute, so every expectation goes through
 * `expectPlacementAt`, which compares in world space and reports in pad space.
 *
 * NOT COVERED HERE — rows 10–11, the void paths (`voidPlatform`,
 * `voidRescueY`, `floating`). A pad sits on solid ground in a normal world, so
 * the downward raycast always finds something and the void branch is
 * unreachable. The only way in is `.structureLocation({ x, y, z }, 'the_end')`
 * with coordinates far from the main island, where the pad hangs over real
 * void; that is a separate spike, not a variation on these tests.
 *
 * Layer 1 of §3b-i (the `bt:gc_graves.impenetrable` block tag) is also absent:
 * no block in this pack or in vanilla carries the tag, so there is nothing to
 * point a test at. Layers 2–4 share the same `isImpenetrable` call.
 */
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { BlockPermutation } from '@minecraft/server';
import type { Vector3 } from '@minecraft/server';
import { GRAVE_ENTITY } from '../constants';
import { addRuntimeImpenetrable, isImpenetrable } from '../death/impenetrable';
import { solvePlacement } from '../death/placement';
import { config } from '../registration';
import {
  LOCKED_TICKS,
  TAG_PLACEMENT,
  anyPlayer,
  expectPlacementAt,
  fill,
  fillPermutation,
  padAt,
  padBlock,
  padOf,
  padWorld,
  place,
  graveTest,
  graveTestAsync,
  withServerConfig,
} from './harness';
import type { Test } from '@minecraft/server-gametest';

const options = { tags: [TAG_PLACEMENT] };
const slowOptions = { tags: [TAG_PLACEMENT], ticks: LOCKED_TICKS };

/** The column every test solves down: pad centre, high above the floor. */
const ABOVE: Vector3 = { x: 8, y: 6, z: 8 };

/**
 * A sealed 3×3 basin at pad x/z 7–9, y 1–3, holding a two-block source column
 * of `fluid` at (8, 2–3, 8). Sealing matters: an open pool spreads over the
 * following ticks and the test stops being deterministic.
 */
const basin = (test: Test, fluid: string): void => {
  fill(test, { x: 7, y: 1, z: 7 }, { x: 9, y: 3, z: 9 }, MinecraftBlockTypes.Stone);
  fill(test, { x: 8, y: 2, z: 8 }, { x: 8, y: 3, z: 8 }, fluid);
};

/** The block a solved placement ended up inside, as a type id. */
const blockAt = (test: Test, x: number, y: number, z: number): string => padBlock(test, padOf(test, { x, y, z })).typeId;

graveTest('placement_ground', (test) => {
  const owner = anyPlayer();
  const placement = solvePlacement(test.getDimension(), padWorld(test, ABOVE), owner);

  // Row 6 — the engine's collision model picks the ground; the grave rests on top of it.
  expectPlacementAt(test, placement, { x: 8, y: 1, z: 8 }, 'a grave over open ground rests on the floor');
  test.assert(placement.fallback !== true, 'open ground must not take the spawn fallback');
  test.assert(placement.floating !== true, 'open ground must not be reported as floating');
  test.succeed();
}, options);

graveTest('placement_inside_wall', (test) => {
  // Row 4 — a solid 3³ around the death point with exactly one air pocket in it.
  fill(test, { x: 7, y: 3, z: 7 }, { x: 9, y: 5, z: 9 }, MinecraftBlockTypes.Stone);
  place(test, { x: 9, y: 4, z: 8 }, MinecraftBlockTypes.Air);

  const owner = anyPlayer();
  const placement = solvePlacement(test.getDimension(), padWorld(test, { x: 8, y: 4, z: 8 }), owner);

  // The ring search prefers a horizontal step, and the pocket is the only free cell.
  expectPlacementAt(test, placement, { x: 9, y: 4, z: 8 }, 'a death inside terrain finds the neighbouring pocket');
  test.succeed();
}, options);

graveTestAsync('placement_water_source', async (test) => {
  basin(test, MinecraftBlockTypes.Water);
  await test.idle(5);

  const owner = anyPlayer();
  const surface = padBlock(test, { x: 8, y: 3, z: 8 });

  test.assert(surface.isLiquid, 'setup: the basin should be full of water');
  test.assert(surface.permutation.getState('liquid_depth') === 0, 'setup: the top of the basin should be a SOURCE block');

  const placement = solvePlacement(test.getDimension(), padWorld(test, ABOVE), owner);

  // Rows 7–9 — source fluid floats the grave; it does not sink to the basin floor.
  expectPlacementAt(test, placement, { x: 8, y: 3, z: 8 }, 'a grave over a water source rests on the surface');
  test.succeed();
}, slowOptions);

graveTestAsync('placement_flowing_water', async (test) => {
  // An open trough at y = 2 running along z = 8, fed from one end so the far
  // cells carry FLOWING water (liquid_depth != 0) rather than source blocks.
  fill(test, { x: 4, y: 1, z: 7 }, { x: 12, y: 1, z: 9 }, MinecraftBlockTypes.Stone);
  fill(test, { x: 4, y: 2, z: 7 }, { x: 12, y: 2, z: 7 }, MinecraftBlockTypes.Stone);
  fill(test, { x: 4, y: 2, z: 9 }, { x: 12, y: 2, z: 9 }, MinecraftBlockTypes.Stone);
  place(test, { x: 4, y: 2, z: 8 }, MinecraftBlockTypes.Stone);
  place(test, { x: 12, y: 2, z: 8 }, MinecraftBlockTypes.Stone);
  // A source at one end keeps the stream alive, and the middle of the trough is
  // set to a FLOWING permutation outright. Waiting on the fluid simulation to
  // spread three blocks was not reliable: a block written from script does not
  // always schedule the fluid tick that would move it.
  place(test, { x: 5, y: 2, z: 8 }, MinecraftBlockTypes.Water);
  fillPermutation(test, { x: 6, y: 2, z: 8 }, { x: 9, y: 2, z: 8 }, BlockPermutation.resolve(MinecraftBlockTypes.FlowingWater, { liquid_depth: 3 }));
  await test.idle(20);

  const owner = anyPlayer();
  const stream = padBlock(test, { x: 8, y: 2, z: 8 });

  test.assert(stream.isLiquid, 'setup: the water should have reached the middle of the trough');
  test.assert(stream.permutation.getState('liquid_depth') !== 0, 'setup: the middle of the trough should be FLOWING, not a source');

  const placement = solvePlacement(test.getDimension(), padWorld(test, ABOVE), owner);

  // Rows 7–9 — flowing fluid is not a surface, so the solver keeps descending.
  expectPlacementAt(test, placement, { x: 8, y: 2, z: 8 }, 'a grave over flowing water sinks to the streambed');
  test.succeed();
}, slowOptions);

graveTestAsync('placement_lava_float', async (test) => {
  basin(test, MinecraftBlockTypes.Lava);
  await test.idle(5);

  const owner = anyPlayer();

  await withServerConfig(test, { protection: { floatOnLava: true } }, async () => {
    const placement = solvePlacement(test.getDimension(), padWorld(test, ABOVE), owner);

    expectPlacementAt(test, placement, { x: 8, y: 3, z: 8 }, 'floatOnLava on: the grave rests on the lava surface');

    return Promise.resolve();
  });

  test.succeed();
}, slowOptions);

graveTestAsync('placement_lava_sink', async (test) => {
  basin(test, MinecraftBlockTypes.Lava);
  await test.idle(5);

  const owner = anyPlayer();

  await withServerConfig(test, { protection: { floatOnLava: false } }, async () => {
    const placement = solvePlacement(test.getDimension(), padWorld(test, ABOVE), owner);

    // Row 9 — lava is ignored, so the ground raycast wins and the grave (which
    // is fire_immune) comes to rest inside the pool, on the basin floor.
    expectPlacementAt(test, placement, { x: 8, y: 2, z: 8 }, 'floatOnLava off: the grave sinks to the basin floor');

    return Promise.resolve();
  });

  test.succeed();
}, slowOptions);

graveTestAsync('placement_impenetrable_config', async (test) => {
  basin(test, MinecraftBlockTypes.Water);
  await test.idle(5);

  const owner = anyPlayer();
  const dimension = test.getDimension();
  // Dying INSIDE the pool: water is a legal cell, so this is where an
  // impenetrable ruling can actually change the answer.
  const drowned = padWorld(test, { x: 8, y: 3, z: 8 });
  const before = solvePlacement(dimension, drowned, owner);

  expectPlacementAt(test, before, { x: 8, y: 3, z: 8 }, 'baseline: water is a legal cell');

  await withServerConfig(test, {}, async () => {
    // Set the leaf directly: impenetrable.ts caches the list through a
    // subscription on this exact path, and only a write to it refreshes that
    // cache. The cache is put back by hand below for the same reason — the
    // scope-wide restore withServerConfig does is not guaranteed to reach it.
    config.server.extraImpenetrableBlocks.set([MinecraftBlockTypes.Water]);
    await test.idle(1);

    const after = solvePlacement(dimension, drowned, owner);
    const landed = blockAt(test, after.x, after.y, after.z);

    test.assert(landed !== MinecraftBlockTypes.Water, `layer 2: water was declared impenetrable, but the grave still landed in ${landed}`);
    config.server.extraImpenetrableBlocks.set([]);
    await test.idle(1);
  });

  test.succeed();
}, slowOptions);

graveTest('placement_impenetrable_rpc', (test) => {
  // Layer 3 is a module-level Set with no removal API, so a test may only ever
  // register a block that cannot affect another test: sponge is solid, which
  // means it was never a legal cell to begin with.
  const size = addRuntimeImpenetrable([MinecraftBlockTypes.Sponge], 'gametest');

  test.assert(size > 0, 'registerImpenetrable should report the runtime set size');
  place(test, { x: 8, y: 1, z: 8 }, MinecraftBlockTypes.Sponge);

  const sponge = padBlock(test, { x: 8, y: 1, z: 8 });

  test.assert(isImpenetrable(sponge), 'layer 3: a block registered over RPC must read as impenetrable');
  test.succeed();
}, options);

graveTest('placement_anti_stack', (test) => {
  const owner = anyPlayer();
  const dimension = test.getDimension();
  const start = padWorld(test, ABOVE);
  // Rows 13–14 — the cell the solver would otherwise choose, already taken.
  const grave = test.spawn(GRAVE_ENTITY, padAt(test, { x: 8, y: 1, z: 8 }));
  const nudgedByGrave = solvePlacement(dimension, start, owner);

  expectPlacementAt(test, nudgedByGrave, { x: 9, y: 1, z: 8 }, 'a second grave steps aside instead of stacking');
  grave.remove();

  const stand = test.spawn(MinecraftEntityTypes.ArmorStand, padAt(test, { x: 8, y: 1, z: 8 }));
  const nudgedByStand = solvePlacement(dimension, start, owner);

  expectPlacementAt(test, nudgedByStand, { x: 9, y: 1, z: 8 }, 'an armor stand repels a grave the same way');
  stand.remove();
  test.succeed();
}, options);

graveTest('placement_fallback_spawn', (test) => {
  // Row 15 — never lose the items. Fill the solver's whole r <= 4 search volume
  // so there is no free cell anywhere near the death, and it must fall back.
  fill(test, { x: 4, y: 4, z: 4 }, { x: 12, y: 12, z: 12 }, MinecraftBlockTypes.Stone);

  const owner = anyPlayer();
  const dimension = test.getDimension();
  const placement = solvePlacement(dimension, padWorld(test, { x: 8, y: 8, z: 8 }), owner);

  test.assert(placement.fallback === true, 'a solver with nowhere to go must report fallback');

  // Asserted against whatever spawn point the owner already has, rather than
  // setting one: this test runs as a real player, and moving somebody's bed
  // spawn is not a side effect a test gets to have.
  const spawn = owner.getSpawnPoint();

  if (spawn) {
    const want = { x: Math.floor(spawn.x), y: Math.floor(spawn.y) + 1, z: Math.floor(spawn.z) };

    test.assert(placement.dim === spawn.dimension.id, `fallback should use the spawn dimension ${spawn.dimension.id}, got ${String(placement.dim)}`);
    test.assert(
      placement.x === want.x && placement.y === want.y && placement.z === want.z,
      `fallback should be one block above the owner spawn point ${String(want.x)} ${String(want.y)} ${String(want.z)}, got ${String(placement.x)} ${String(placement.y)} ${String(placement.z)}`,
    );
  } else {
    const overworld = 'minecraft:overworld';

    test.assert(placement.dim === overworld, `with no personal spawn the fallback is the world spawn in ${overworld}, got ${String(placement.dim)}`);
  }

  test.succeed();
}, slowOptions);

/**
 * The engine contract the fluid sounding rests on, pinned down.
 *
 * Measured in game, from six blocks above a two-deep water source column:
 *
 *   passable=false liquid=false → minecraft:stone at pad 8 1 8
 *   passable=false liquid=true  → minecraft:stone at pad 8 1 8   (unchanged!)
 *   passable=true  liquid=true  → minecraft:water at pad 8 3 8
 *
 * `includeLiquidBlocks` on its own does nothing: a liquid is a PASSABLE block,
 * so `includePassableBlocks: false` discards it before the liquid flag is
 * consulted. The solver used to pass exactly that pair, which is why floating
 * on water and lava never worked. If a future engine build changes this, the
 * fix in `firstFluid` needs revisiting — hence a test rather than a comment.
 */
graveTestAsync('placement_fluid_ray_contract', async (test) => {
  basin(test, MinecraftBlockTypes.Water);
  await test.idle(10);

  const dimension = test.getDimension();
  const from = padWorld(test, ABOVE);
  const down = { x: 0, y: -1, z: 0 };

  const strict = dimension.getBlockFromRay(from, down, { includePassableBlocks: false, includeLiquidBlocks: true, maxDistance: 32 });
  const loose = dimension.getBlockFromRay(from, down, { includePassableBlocks: true, includeLiquidBlocks: true, maxDistance: 32 });

  test.assert(
    strict?.block.isLiquid !== true,
    `includePassableBlocks:false now DOES return liquids (${String(strict?.block.typeId)}) — firstFluid can be simplified`,
  );
  test.assert(
    loose?.block.isLiquid === true,
    `the fluid sounding found ${String(loose?.block.typeId)} instead of water — firstFluid is broken`,
  );

  const at = loose ? padOf(test, loose.block.location) : undefined;

  test.assert(at?.y === 3, `the fluid sounding should stop on the surface at pad y 3, got ${String(at?.y)}`);
  test.succeed();
}, slowOptions);
