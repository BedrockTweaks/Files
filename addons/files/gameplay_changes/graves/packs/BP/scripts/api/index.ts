import { addRuntimeImpenetrable } from '../death/impenetrable';
import { addRuntimeRepelling } from '../death/repelling';

/** Session-scoped placement rules shared with other addons. */
export const API = {
  async registerRepelling({ ids }: { ids: string[] }): Promise<number> {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
      throw new Error('registerRepelling expects { ids: string[] }');
    }

    return addRuntimeRepelling(ids, 'addon API');
  },
  async registerImpenetrable({ ids }: { ids: string[] }): Promise<number> {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
      throw new Error('registerImpenetrable expects { ids: string[] }');
    }

    return addRuntimeImpenetrable(ids, 'addon API');
  },
};
