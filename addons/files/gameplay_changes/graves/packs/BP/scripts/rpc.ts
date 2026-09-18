/**
 * §7 — the cross-addon surface. Typed end to end: consumers call it with
 * `core.rpc.typed<GravesRPC>('bt_gc_graves')` and get the same signatures.
 */
import { core } from './registration';
import { visibleRecordsOf } from './index/store';
import { addRuntimeImpenetrable } from './death/impenetrable';
import type { GravesRPC } from './types';

export function initRpc(): void {
  core.rpc.serve<GravesRPC>({
    getGraves: ({ playerId }) => visibleRecordsOf(playerId),
    countGraves: ({ playerId }) => visibleRecordsOf(playerId).length,
    registerImpenetrable: ({ ids }, from) => {
      if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
        throw new Error('registerImpenetrable expects { ids: string[] }');
      }

      return addRuntimeImpenetrable(ids, from);
    },
  });
}
