/**
 * One entry in the authoritative Bedrock Core grave collection. Grave entities
 * carry the inventory payload; this record keeps the grave discoverable while
 * its chunk is unloaded.
 */
export interface GraveRecord {
  /** entity.id — the handle for world.getEntity() once its chunk is loaded. */
  id: string;
  /** Owner player.id. */
  owner: string;
  ownerName: string;
  /** dimension.id — works for custom dimensions. */
  dim: string;
  x: number;
  y: number;
  z: number;
  /** Epoch ms at death — survives restarts, unlike tick counters. */
  diedAt: number;
  /** Total stored item count, for list summaries. */
  items: number;
  xp: number;
  /** damageSource.cause at death. */
  cause?: string;
  /** typeId of the killing entity, if any. */
  killer?: string;
  /** §3b row 11 — hovering over the void (no platform placed). */
  floating?: true;
  /** Owner ticked this grave off their locator bar (§8). Absent means shown. */
  noWaypoint?: true;
  /** Tombstone — remove the entity the moment its chunk loads (§6a). */
  purge?: true;
}

/** The world-scoped document stored by the Bedrock Core `graves` collection. */
export interface GraveCollectionDocument {
  /** Entity id -> grave metadata. A map keeps lookup and replacement atomic. */
  records: Record<string, GraveRecord>;
}

/** Cross-addon RPC surface (§7), served in rpc.ts via `core.rpc.serve<GravesRPC>`. */
export interface GravesRPC {
  /** §3b-i layer 3 — register block ids graves must never occupy or replace. */
  registerImpenetrable(params: { ids: string[] }): number;
  /** Register entity types that graves must not share a cell with. */
  registerRepelling(params: { ids: string[] }): number;
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  /** Hovering over the void — no ground and no platform. */
  floating?: boolean;
  /** Solver gave up; position is the player/world spawn. */
  fallback?: boolean;
  /** Dimension id override (only set by the fallback path). */
  dim?: string;
}
