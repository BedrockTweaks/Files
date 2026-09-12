/**
 * §8 — the locator bar. Each of a player's own graves becomes a waypoint on
 * their bar, the Bedrock answer to the Java pack's `/graves list` coordinates
 * hunt: the direction is on the HUD, so nobody has to copy numbers out of chat.
 *
 * Waypoints are OWNER-ONLY, on purpose. `allowRobbing` opens someone else's
 * grave to you, but it does not put a marker on it — a server-wide bar of
 * everyone's death piles would be a loot map, not a convenience.
 *
 * The set is reconciled, never incrementally patched: `sync()` diffs what the
 * index says against what we put on the bar and applies the difference. Every
 * trigger — index write, respawn, either config toggle — runs the same path,
 * so there is no ordering between them to get wrong.
 */
import type { LocatorBar, Player } from '@minecraft/server';
import { LocationWaypoint, system, WaypointTexture, world } from '@minecraft/server';
import { WAYPOINT_COLOR, WAYPOINT_TEXTURE } from './constants';
import { visibleRecordsOf } from './index/store';
import { config, core } from './registration';
import type { GraveRecord } from './types';
import { dimensionOf } from './util';

/** One tracked waypoint and the record position it was built from. */
interface Tracked {
  waypoint: LocationWaypoint;
  dim: string;
  x: number;
  y: number;
  z: number;
}

/** player.id → graveId → tracked waypoint. Rebuilt from scratch on rejoin. */
const tracked = new Map<string, Map<string, Tracked>>();

/** Per-player unsubscribe for the player-scope toggle, dropped on leave. */
const unsubscribes = new Map<string, () => void>();

/**
 * The custom grave icon, with the vanilla square as the fallback shape.
 *
 * A texture selector is validated when the waypoint is built, and a rejected
 * one takes the whole waypoint with it — so a bad path must not be able to
 * cost the player their marker. `buildWaypoint` catches that and retries with
 * the built-in texture, which cannot fail.
 */
const selectorFor = (custom: boolean): { textureBoundsList: [{ lowerBound: number; texture: WaypointTexture | { path: string; iconWidth: number; iconHeight: number } }] } => ({
  textureBoundsList: [
    {
      lowerBound: 0,
      texture: custom
        ? { path: WAYPOINT_TEXTURE, iconWidth: 1, iconHeight: 1 }
        : WaypointTexture.Square,
    },
  ],
});

/** Whether the RP icon has already proven itself unusable in this session. */
let customTextureBroken = false;

const buildWaypoint = (record: GraveRecord): LocationWaypoint | undefined => {
  const dimension = dimensionOf(record.dim);

  if (!dimension) {
    return undefined;
  }

  const at = { dimension, x: record.x + 0.5, y: record.y, z: record.z + 0.5 };

  if (!customTextureBroken) {
    try {
      return new LocationWaypoint(at, selectorFor(true), WAYPOINT_COLOR);
    } catch (error) {
      customTextureBroken = true;
      console.warn(`[graves] locator icon '${WAYPOINT_TEXTURE}' rejected, falling back to the vanilla square: ${String(error)}`);
    }
  }

  try {
    return new LocationWaypoint(at, selectorFor(false), WAYPOINT_COLOR);
  } catch (error) {
    console.error(`[graves] could not build a waypoint for grave ${record.id}: ${String(error)}`);

    return undefined;
  }
};

const drop = (bar: LocatorBar, entry: Tracked): void => {
  try {
    bar.removeWaypoint(entry.waypoint);
  } catch {
    // Already gone: the engine drops invalid waypoints on its own next tick.
  }

  try {
    entry.waypoint.remove();
  } catch {
    // Same — nothing to do, and nothing that should reach the player.
  }
};

/** Which graves this player should currently see marked. */
const wanted = (player: Player): GraveRecord[] => {
  if (!config.server.access.allowLocating.get()) {
    return [];
  }

  if (!config.player.for(player).showOnLocatorBar.get()) {
    return [];
  }

  // visibleRecordsOf is keyed by owner: a player is only ever handed their own
  // graves, so no waypoint can point at someone else's death pile — not with
  // robbing on, not from the admin panel, not at all.
  // Newest first, so the cap below keeps the graves a player is most likely
  // to still want rather than an arbitrary slice.
  return [...visibleRecordsOf(player.id)]
    .filter(record => !record.noWaypoint)
    .sort((a, b) => b.diedAt - a.diedAt);
};

/**
 * Reconcile one player's bar with the index.
 *
 * Cheap enough to run on every index write: it reads one dynamic property and
 * walks a handful of records, and it only touches the bar where the two sides
 * actually disagree.
 */
export const sync = (player: Player): void => {
  let mine = tracked.get(player.id);

  if (!mine) {
    mine = new Map<string, Tracked>();
    tracked.set(player.id, mine);
  }

  const bar = player.locatorBar;
  const records = wanted(player);
  const live = new Set(records.map(r => r.id));

  for (const [graveId, entry] of mine) {
    if (!live.has(graveId)) {
      drop(bar, entry);
      mine.delete(graveId);
    }
  }

  // Our own share of the bar is what we may fill; other packs' waypoints are
  // counted by `count` but are neither ours to read nor ours to evict.
  const room = Math.max(0, bar.maxCount - (bar.count - mine.size));

  for (const record of records) {
    const existing = mine.get(record.id);

    if (existing) {
      // A grave that drifted (reconcile refreshed its position) moves its
      // marker rather than rebuilding it — the handle stays valid.
      if (existing.dim !== record.dim || existing.x !== record.x || existing.y !== record.y || existing.z !== record.z) {
        const dimension = dimensionOf(record.dim);

        if (dimension) {
          try {
            existing.waypoint.setDimensionLocation({ dimension, x: record.x + 0.5, y: record.y, z: record.z + 0.5 });
            existing.dim = record.dim;
            existing.x = record.x;
            existing.y = record.y;
            existing.z = record.z;
          } catch (error) {
            console.warn(`[graves] could not move waypoint for grave ${record.id}: ${String(error)}`);
          }
        }
      }

      continue;
    }

    if (mine.size >= room) {
      break;
    }

    const waypoint = buildWaypoint(record);

    if (!waypoint) {
      continue;
    }

    try {
      bar.addWaypoint(waypoint);
      mine.set(record.id, { waypoint, dim: record.dim, x: record.x, y: record.y, z: record.z });
    } catch (error) {
      // A full bar or a racing removal — the next sync tries again.
      waypoint.remove();
      console.warn(`[graves] could not add waypoint for grave ${record.id}: ${String(error)}`);
    }
  }
};

const syncAll = (): void => {
  for (const player of world.getAllPlayers()) {
    sync(player);
  }
};

/** Forget a player's bookkeeping — their bar goes with them. */
const forget = (playerId: string): void => {
  unsubscribes.get(playerId)?.();
  unsubscribes.delete(playerId);
  tracked.delete(playerId);
};

export function initLocator(): void {
  // Spawn covers both halves of the lifecycle: the join that has to build the
  // set from nothing, and the respawn right after the death that created a
  // grave. Bookkeeping is dropped first — a rejoining player gets a fresh bar
  // from the engine, so last session's handles are stale by definition.
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (initialSpawn) {
      forget(player.id);

      const unsubscribe = config.player.for(player).showOnLocatorBar.subscribe(() => {
        sync(player);
      });

      unsubscribes.set(player.id, unsubscribe);
    }

    sync(player);
  });

  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    forget(playerId);
  });

  // Every index write already republishes the grave summary to `core.state`
  // (see store.ts), and a set() always emits — even when the summary value is
  // unchanged, as a position-only update leaves it. So this one subscription
  // covers a grave created, looted, purged, despawned or moved, with no
  // second notification channel to keep in step with the first.
  //
  // Index writes happen inside read-only-ish handlers (entityDie, entityLoad);
  // the bar is a privileged API, so touch it next tick.
  core.state.subscribe(() => {
    system.run(syncAll);
  });

  // The server-wide switch moves every bar at once.
  config.server.access.allowLocating.subscribe(() => {
    system.run(syncAll);
  });
}
