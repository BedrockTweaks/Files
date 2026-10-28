import { EntityComponentTypes, system } from '@minecraft/server';
import type { ContainerEvent, PressEvent } from '@bedrock-core/ui';
import { grantXp, isGrave, removeGrave } from '../lifecycle';
import { EQUIP_SLOTS, PLAYER_CONTAINER_SLOTS, playerSlotForGraveSlot } from '../constants';
import { config } from '../registration';

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

/** Restore available original slots, then pack displaced items without dropping overflow. */
export const retrieveAvailableItems = ({ host, container, player }: PressEvent): void => {
  if (!host || !container || 'permutation' in host || !host.isValid || !isGrave(host) || !container.isValid || !player.isValid) {
    return;
  }

  const inventory = player.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;

  if (!inventory || !graveDocuments.for(host).get()) {
    return;
  }

  let moved = 0;

  if (config.server.contents.restoreToOriginalSlots.get()) {
    // Reserve original slots before packing displaced stacks into free space.
    for (let slot = 0; slot < PLAYER_CONTAINER_SLOTS && slot < container.size; slot++) {
      const stack = container.getItem(slot);
      const playerSlot = playerSlotForGraveSlot(slot);

      if (stack && !inventory.getItem(playerSlot)) {
        inventory.setItem(playerSlot, stack);
        container.setItem(slot, undefined);
        moved += stack.amount;
      }
    }

    const equippable = player.getComponent<EntityComponentTypes.Equippable>(EntityComponentTypes.Equippable);

    for (let i = 0; equippable && i < EQUIP_SLOTS.length && PLAYER_CONTAINER_SLOTS + i < container.size; i++) {
      const slot = PLAYER_CONTAINER_SLOTS + i;
      const stack = container.getItem(slot);
      const equipmentSlot = EQUIP_SLOTS[i];

      if (stack && !equippable.getEquipment(equipmentSlot) && equippable.setEquipment(equipmentSlot, stack)) {
        container.setItem(slot, undefined);
        moved += stack.amount;
      }
    }
  }

  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);

    if (!stack) {
      continue;
    }

    const leftover = container.transferItem(slot, inventory);

    moved += stack.amount - (leftover?.amount ?? 0);
  }

  if (moved > 0) {
    player.playSound('armor.equip_generic');
  }

  updateGraveContainer({ host, container, player });
};
