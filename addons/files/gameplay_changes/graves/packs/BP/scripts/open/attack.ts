/**
 * §3a action 3 — attack ×2. The first hit shakes the grave (RP animation via
 * the client-synced `bt:shaking` property) and shows the tip; a second hit
 * inside the window scatters everything on the ground. The grave itself is
 * unkillable — the damage sensor lets the swing land without damage.
 */
import { system, world } from '@minecraft/server';
import type { Entity, Player } from '@minecraft/server';
import { PROP_SHAKE_UNTIL, SHAKE_WINDOW_TICKS, SHAKING_PROPERTY } from '../constants';
import { dropAt, grantXp, graveContainer, graveXp, isGrave, removeGrave } from '../lifecycle';
import { authorize, consumeKey, refuse } from './auth';
import { i18n } from '../UI/i18n';
import { isPlayer } from '../util';

const scatter = (grave: Entity, player: Player): void => {
  const container = graveContainer(grave);

  if (container) {
    for (let slot = 0; slot < container.size; slot++) {
      const item = container.getItem(slot);

      if (item) {
        dropAt(grave, item);
        container.setItem(slot, undefined);
      }
    }
  }

  grantXp(player, graveXp(grave));
  grave.dimension.playSound('dig.stone', grave.location);
  removeGrave(grave);
};

export function initAttack(): void {
  world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    if (!isGrave(hitEntity) || !isPlayer(damagingEntity)) {
      return;
    }

    const player = damagingEntity;
    const auth = authorize(player, hitEntity);

    if (!auth.allowed) {
      refuse(player);

      return;
    }

    const shakeUntil = hitEntity.getDynamicProperty(PROP_SHAKE_UNTIL);

    if (typeof shakeUntil === 'number' && system.currentTick <= shakeUntil) {
      if (auth.needsKey) {
        consumeKey(player);
      }

      scatter(hitEntity, player);

      return;
    }

    // First hit: shake, and nudge the player toward the tidy path.
    hitEntity.setDynamicProperty(PROP_SHAKE_UNTIL, system.currentTick + SHAKE_WINDOW_TICKS);
    hitEntity.setProperty(SHAKING_PROPERTY, true);
    hitEntity.dimension.playSound('hit.stone', hitEntity.location);
    system.runTimeout(() => {
      if (hitEntity.isValid) {
        hitEntity.setProperty(SHAKING_PROPERTY, false);
      }
    }, SHAKE_WINDOW_TICKS);

    player.onScreenDisplay.setActionBar(i18n.forPlayer(player).t($ => $.open.tip));
  });
}
