/**
 * The grave index record (§6). The index — world dynamic properties, one per
 * owner — is authoritative; the grave entity is the payload. A grave in an
 * unloaded chunk exists only here.
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
  /** Occupied slot count, for list summaries. */
  items: number;
  xp: number;
  /** damageSource.cause at death. */
  cause?: string;
  /** typeId of the killing entity, if any. */
  killer?: string;
  /** §3b row 11 — hovering over the void (no platform placed). */
  floating?: true;
  /** Tombstone — remove the entity the moment its chunk loads (§6a). */
  purge?: true;
}

/** Cross-addon RPC surface (§7), served in rpc.ts via `core.rpc.serve<GravesRPC>`. */
export interface GravesRPC {
  getGraves(params: { playerId: string }): GraveRecord[];
  countGraves(params: { playerId: string }): number;
  /** §3b-i layer 3 — register block ids graves must never occupy or replace. */
  registerImpenetrable(params: { ids: string[] }): number;
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
