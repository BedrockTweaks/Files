/**
 * §3a — the three authorisation gates: owner, robbing enabled, grave key.
 * `authorize` is read-only (safe inside a before-event); key consumption is a
 * separate call for the normal-execution side.
 */
import { EntityComponentTypes, EquipmentSlot, GameMode } from '@minecraft/server';
import type { Entity, Player } from '@minecraft/server';
import { config } from '../registration';
import { GRAVE_KEY_ITEM, PROP_OWNER } from '../constants';
import { i18n } from '../UI/i18n';

export interface AuthResult {
  allowed: boolean;
  /** Access was granted by a grave key — consume one on success. */
  needsKey: boolean;
}

const KEY_HANDS: readonly EquipmentSlot[] = [EquipmentSlot.Mainhand, EquipmentSlot.Offhand];

const holdsKey = (player: Player): boolean => {
  const equippable = player.getComponent<EntityComponentTypes.Equippable>(EntityComponentTypes.Equippable);

  return KEY_HANDS.some(slot => equippable?.getEquipment(slot)?.typeId === GRAVE_KEY_ITEM);
};

export const authorize = (player: Player, grave: Entity): AuthResult => {
  if (grave.getDynamicProperty(PROP_OWNER) === player.id) {
    return { allowed: true, needsKey: false };
  }

  const access = config.server.access.get();

  if (access.allowRobbing) {
    return { allowed: true, needsKey: false };
  }

  if (access.graveKeyEnabled && holdsKey(player)) {
    return { allowed: true, needsKey: true };
  }

  return { allowed: false, needsKey: false };
};

/** Take one key from whichever hand holds it. Creative players keep theirs. */
export const consumeKey = (player: Player): void => {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  const equippable = player.getComponent<EntityComponentTypes.Equippable>(EntityComponentTypes.Equippable);

  if (!equippable) {
    return;
  }

  for (const slot of KEY_HANDS) {
    const item = equippable.getEquipment(slot);

    if (item?.typeId === GRAVE_KEY_ITEM) {
      if (item.amount > 1) {
        item.amount -= 1;
        equippable.setEquipment(slot, item);
      } else {
        equippable.setEquipment(slot, undefined);
      }

      player.sendMessage(i18n.forPlayer(player).t($ => $.open.keyConsumed));

      return;
    }
  }
};

export const refuse = (player: Player): void => {
  player.sendMessage(`§c${i18n.forPlayer(player).t($ => $.open.robbingDisabled)}`);
};
