import { system } from '@minecraft/server';
import type { ContainerEvent } from '@bedrock-core/ui';
import { grantXp, removeGrave } from '../lifecycle';

import { graveDocuments, graveDirectory } from '../storage/documents';

/** Reconcile the author's slots after the container runtime finishes a move. */
export const updateGraveContainer = ({ host, container, player }: ContainerEvent): void => {
  if ('permutation' in host) {
    return;
  }

  system.run(() => {
    if (!host.isValid || !container.isValid) {
      return;
    }

    const document = graveDocuments.for(host);
    const stored = document.get();

    if (!stored) {
      return;
    }

    let items = 0;

    for (let slot = 0; slot < container.size; slot++) {
      items += container.getItem(slot)?.amount ?? 0;
    }

    if (items > 0 || !player.isValid) {
      if (stored.items !== items) {
        document.patch({ items });
        graveDirectory.patch({ records: { [host.id]: { items } } });
      }

      return;
    }

    grantXp(player, stored.xp);
    host.dimension.playSound('armor.equip_generic', host.location);
    removeGrave(host);
  });
};
