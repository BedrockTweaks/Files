/**
 * The placement solver (§3b): solve the grave's position once, in script —
 * the entity itself is frozen (no gravity, no collision, no push), so this is
 * the only thing that ever decides where a grave stands.
 *
 * Two engine raycasts replace the Java pack's 19 recursive functions: the
 * engine's own collision model decides what is passable (torches, plants,
 * addon decorations), and `liquid_depth === 0` separates source fluid
 * (float) from flowing fluid (keep descending).
 */
import type { Block, Dimension, Player, Vector3 } from '@minecraft/server';
import { world } from '@minecraft/server';
import { config } from '../registration';
import { REPELLING_ENTITIES } from '../constants';
import { isImpenetrable } from './impenetrable';
import type { Placement } from '../types';

const DOWN: Vector3 = { x: 0, y: -1, z: 0 };

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/** `getBlock` throws outside world bounds and returns undefined in unloaded chunks — never assume. */
const safeBlock = (dim: Dimension, pos: Vector3): Block | undefined => {
  try {
    return dim.getBlock(pos);
  } catch {
    return undefined;
  }
};

const hasRepeller = (dim: Dimension, pos: Vector3): boolean => {
  try {
    return dim.getEntitiesAtBlockLocation(pos).some(e => REPELLING_ENTITIES.has(e.typeId));
  } catch {
    return false;
  }
};

/** A cell the grave may occupy: air or liquid, not impenetrable, not already claimed. */
const isFreeCell = (dim: Dimension, pos: Vector3): boolean => {
  const block = safeBlock(dim, pos);

  if (!block || (!block.isAir && !block.isLiquid) || isImpenetrable(block)) {
    return false;
  }

  return !hasRepeller(dim, pos);
};

/**
 * §3b row 4 — a death inside solid terrain (suffocation, /tp into a wall)
 * searches outward r = 0...4 for the nearest free cell, horizontal preferred.
 */
const findFreeCell = (dim: Dimension, base: Vector3, min: number, max: number): Vector3 | undefined => {
  for (let r = 0; r <= 4; r++) {
    const ring: Vector3[] = [];

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) === r) {
            ring.push({ x: base.x + dx, y: base.y + dy, z: base.z + dz });
          }
        }
      }
    }

    ring.sort((a, b) => Math.abs(a.y - base.y) - Math.abs(b.y - base.y));

    for (const pos of ring) {
      if (pos.y > min && pos.y < max && isFreeCell(dim, pos)) {
        return pos;
      }
    }
  }

  return undefined;
};

/** §3b rows 13–14 — never stack two graves in one cell; nudge sideways instead. */
const antiStack = (dim: Dimension, pos: Vector3): Vector3 => {
  if (!hasRepeller(dim, pos)) {
    return pos;
  }

  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
    const candidate = { x: pos.x + dx, y: pos.y, z: pos.z + dz };

    if (isFreeCell(dim, candidate)) {
      return candidate;
    }
  }

  return pos;
};

/** §3b row 15 — never lose the items: player spawn, then world spawn. */
const fallbackToSpawn = (owner: Player): Placement => {
  const spawn = owner.getSpawnPoint();

  if (spawn) {
    return { x: Math.floor(spawn.x), y: Math.floor(spawn.y) + 1, z: Math.floor(spawn.z), dim: spawn.dimension.id, fallback: true };
  }

  const overworld = world.getDimension('minecraft:overworld');
  const worldSpawn = world.getDefaultSpawnLocation();
  const { min, max } = overworld.heightRange;
  let y = worldSpawn.y;

  // The default spawn's y is a sentinel (32767) until the world computes it.
  if (y <= min || y >= max) {
    const top = overworld.getTopmostBlock({ x: worldSpawn.x, z: worldSpawn.z });

    y = top ? top.y + 1 : 100;
  }

  return { x: Math.floor(worldSpawn.x), y, z: Math.floor(worldSpawn.z), dim: overworld.id, fallback: true };
};

export function solvePlacement(dim: Dimension, start: Vector3, owner: Player): Placement {
  const { min, max } = dim.heightRange; // rows 2, 3, 12 — never hardcode ±64/320
  const protection = config.server.protection.get();

  const base = {
    x: Math.floor(start.x),
    y: clamp(Math.floor(start.y), min + 1, max - 2),
    z: Math.floor(start.z),
  };

  const free = findFreeCell(dim, base, min, max);

  if (!free) {
    return fallbackToSpawn(owner);
  }

  const maxDistance = free.y - min;

  if (maxDistance > 0) {
    // 1. First block that actually STOPS something — engine decides passability (row 6).
    const ground = dim.getBlockFromRay(free, DOWN, {
      includePassableBlocks: false,
      includeLiquidBlocks: false,
      maxDistance,
    });

    // 2. First fluid surface. Only matters if it sits ABOVE the ground hit (rows 7–9).
    const fluid = dim.getBlockFromRay(free, DOWN, {
      includePassableBlocks: false,
      includeLiquidBlocks: true,
      maxDistance,
    });

    if (fluid?.block.isLiquid) {
      const isSource = fluid.block.permutation.getState('liquid_depth') === 0;
      const isLava = fluid.block.typeId.includes('lava');
      const aboveGround = !ground || fluid.block.location.y > ground.block.location.y;

      if (isSource && aboveGround && (!isLava || protection.floatOnLava)) {
        const rest = antiStack(dim, fluid.block.location);

        return { x: rest.x, y: rest.y, z: rest.z };
      }
    }

    if (ground) {
      const rest = antiStack(dim, { x: ground.block.location.x, y: ground.block.location.y + 1, z: ground.block.location.z });

      return { x: rest.x, y: rest.y, z: rest.z };
    }
  }

  // Void below (rows 10–11).
  if (protection.voidPlatform) {
    const graveY = clamp(Math.max(min + 1, protection.voidRescueY), min + 1, max - 2);
    const under = safeBlock(dim, { x: free.x, y: graveY - 1, z: free.z });

    if (under && (under.isAir || under.isLiquid) && !isImpenetrable(under)) {
      dim.setBlockType(under.location, `minecraft:${protection.voidPlatformBlock}`);

      return { x: free.x, y: graveY, z: free.z };
    }
  }

  return { x: free.x, y: min + 1, z: free.z, floating: true };
}
