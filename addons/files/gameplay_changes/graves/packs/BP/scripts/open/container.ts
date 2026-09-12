/**
 * §3a action 1 — right-click opens the grave's native container screen (the
 * engine does that for free). There is no close event for entity containers,
 * so an opened grave is watched with a short poll: fully emptied → XP goes to
 * the opener and the grave removes itself; anything left → it survives.
 */
import { system } from '@minecraft/server';
import type { Entity, Player } from '@minecraft/server';
import { grantXp, graveContainer, graveXp, removeGrave } from '../lifecycle';

const WATCH_INTERVAL_TICKS = 10;
const WATCH_TIMEOUT_TICKS = 6000; // 5 minutes — a screen never stays open that long

const watched = new Set<string>();

export function watchGrave(grave: Entity, opener: Player): void {
  if (watched.has(grave.id)) {
    return;
  }

  watched.add(grave.id);
  const startedAt = system.currentTick;

  const interval = system.runInterval(() => {
    const stop = (): void => {
      watched.delete(grave.id);
      system.clearRun(interval);
    };

    if (!grave.isValid || system.currentTick - startedAt > WATCH_TIMEOUT_TICKS) {
      stop();

      return;
    }

    const container = graveContainer(grave);

    if (!container) {
      stop();

      return;
    }

    if (container.emptySlotsCount === container.size) {
      if (opener.isValid) {
        grantXp(opener, graveXp(grave));
      }

      grave.dimension.playSound('armor.equip_generic', grave.location);
      removeGrave(grave);
      stop();
    }
  }, WATCH_INTERVAL_TICKS);
}
