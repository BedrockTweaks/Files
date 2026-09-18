/**
 * §3b-i — "may a grave occupy or replace this block?" is policy, not physics,
 * so it is as dynamic as Bedrock allows. Four layers, checked in order:
 *  1. block tag `bt:gc_graves.impenetrable` — any addon opts its blocks in, zero coupling
 *  2. config list `server.protection.extraImpenetrableBlocks` — operator-editable
 *  3. RPC `registerImpenetrable` (served in rpc.ts) — other addons, at runtime
 *  4. a small vanilla fallback set
 */
import type { Block } from '@minecraft/server';
import { config } from '../registration';
import { IMPENETRABLE_TAG, VANILLA_IMPENETRABLE } from '../constants';

const runtimeIds = new Set<string>();
let configIds: readonly string[] = [];

const normalize = (id: string): string => (id.includes(':') ? id : `minecraft:${id}`);

export const isImpenetrable = (block: Block): boolean =>
  block.hasTag(IMPENETRABLE_TAG)
  || runtimeIds.has(block.typeId)
  || configIds.includes(block.typeId)
  || VANILLA_IMPENETRABLE.has(block.typeId);

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
  configIds = config.server.extraImpenetrableBlocks.get().map(normalize);
}
