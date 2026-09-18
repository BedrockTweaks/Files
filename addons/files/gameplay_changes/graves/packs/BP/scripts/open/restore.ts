/**
 * §3a action 2 — sneak + interact: everything back into the player's own
 * inventory. Two passes: every item whose original slot is still free claims
 * it FIRST, and only then do the displaced ones fall back to any free slot
 * (via addItem) and finally the floor. A single pass would let a displaced
 * item squat in a later item's original slot and cascade the misplacement.
 * XP is added directly.
 */
import { EntityComponentTypes } from '@minecraft/server';
import type { Entity, ItemStack, Player } from '@minecraft/server';
import { config } from '../registration';
import { PLAYER_CONTAINER_SLOTS } from '../constants';
import { EQUIP_SLOTS, dropAt, grantXp, graveContainer, graveXp, removeGrave } from '../lifecycle';
import { i18n } from '../UI/i18n';

export function restoreToPlayer(grave: Entity, player: Player): void {
  const container = graveContainer(grave);
  const inventory = player.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;
  const equippable = player.getComponent<EntityComponentTypes.Equippable>(EntityComponentTypes.Equippable);

  if (!container || !inventory || !equippable) {
    return;
  }

  const toOriginalSlots = config.server.contents.restoreToOriginalSlots.get();
  const displaced: ItemStack[] = [];
  let overflow = 0;

  // Pass 1 — exact restores, while no displaced item has taken anyone's home.
  for (let slot = 0; slot < PLAYER_CONTAINER_SLOTS && slot < container.size; slot++) {
    const item = container.getItem(slot);

    if (!item) {
      continue;
    }

    if (toOriginalSlots && !inventory.getItem(slot)) {
      inventory.setItem(slot, item);
    } else {
      displaced.push(item);
    }
  }

  for (let i = 0; i < EQUIP_SLOTS.length; i++) {
    const item = container.getItem(PLAYER_CONTAINER_SLOTS + i);

    if (!item) {
      continue;
    }

    if (toOriginalSlots && !equippable.getEquipment(EQUIP_SLOTS[i])) {
      equippable.setEquipment(EQUIP_SLOTS[i], item);
    } else {
      displaced.push(item);
    }
  }

  // Pass 2 — whatever could not go home: stack/free slot, then the floor.
  for (const item of displaced) {
    const leftover = inventory.addItem(item);

    if (leftover) {
      dropAt(grave, leftover, player.location);
      overflow += leftover.amount;
    }
  }

  const xp = graveXp(grave);

  grantXp(player, xp);
  removeGrave(grave);
  player.playSound('armor.equip_generic');

  const { t } = i18n.forPlayer(player);

  player.sendMessage(t($ => $.open.restored));

  if (overflow > 0) {
    player.sendMessage(t($ => $.open.overflow, { count: overflow }));
  }

  if (xp > 0) {
    player.sendMessage(t($ => $.open.xp, { amount: xp }));
  }
}
