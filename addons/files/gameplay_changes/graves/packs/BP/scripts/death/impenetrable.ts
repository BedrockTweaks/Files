/**
 * §3b-i — "may a grave occupy or replace this block?" is policy, not physics,
 * so it is as dynamic as Bedrock allows. Four layers, checked in order:
 *  1. block tag `bt:gc_graves.impenetrable` — any addon opts its blocks in, zero coupling
 *  2. config list `server.extraImpenetrableBlocks` — operator-editable
 *  3. RPC `registerImpenetrable` (served in rpc.ts) — other addons, at runtime
 *  4. a small vanilla fallback set
 */
import { system, type Block } from '@minecraft/server';
import { config } from '../registration';

/**
 * §3b-i layer 4 — vanilla blocks a grave must never occupy or replace.
 * Layers 1–3 (block tag, config list, RPC) extend this at runtime.
 */
const VANILLA_IMPENETRABLE: ReadonlySet<string> = new Set([
  'minecraft:bedrock',
  'minecraft:barrier',
  'minecraft:command_block',
  'minecraft:chain_command_block',
  'minecraft:repeating_command_block',
  'minecraft:structure_block',
  'minecraft:structure_void',
  'minecraft:jigsaw',
  'minecraft:light_block',
  'minecraft:end_portal',
  'minecraft:end_portal_frame',
  'minecraft:end_gateway',
  'minecraft:allow',
  'minecraft:deny',
  'minecraft:border_block',
]);

/** Block tag other addons can put on their blocks to keep graves out (§3b-i layer 1). */
export const IMPENETRABLE_TAG = 'bt:gc_graves.impenetrable';

const runtimeIds = new Set<string>();
let configIds: readonly string[] = [];

const normalize = (id: string): string => (id.includes(':') ? id : `minecraft:${id}`);

/**
 * Every read here goes through the world, and a `Block` handle can outlive the
 * chunk being TICKING — `getBlock` hands one back for a chunk that is merely
 * loaded, and then `typeId`/`hasTag` throw `LocationInUnloadedChunkError`. A
 * block nobody can read is not a block we have an opinion about, so an
 * unreadable one is reported as penetrable and the caller's own guards decide.
 */
export const isImpenetrable = (block: Block): boolean => {
  try {
    return runtimeIds.has(block.typeId)
      || configIds.includes(block.typeId)
      || VANILLA_IMPENETRABLE.has(block.typeId)
      || block.hasTag(IMPENETRABLE_TAG);
  } catch {
    return false;
  }
};

/** Layer 3 — called by the typed RPC surface. Returns the runtime set's size. */
export const addRuntimeImpenetrable = (ids: readonly string[], from: string): number => {
  for (const id of ids) {
    runtimeIds.add(normalize(id));
  }

  console.info(`[graves] '${from}' registered ${String(ids.length)} impenetrable block id(s)`);

  return runtimeIds.size;
};

export function initImpenetrable(): void {
  config.server.extraImpenetrableBlocks.subscribe((next) => {
    configIds = next.map(normalize);
  });
  system.run(() => {
    configIds = config.server.extraImpenetrableBlocks.get().map(normalize);
  });
}
