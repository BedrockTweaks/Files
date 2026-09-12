/**
 * §3a — the interact gate. The native container screen can only be refused
 * here, in the before-event, so authorization for BOTH branches runs here.
 * Before-event callbacks are restricted execution: only `cancel` is touched
 * synchronously; every side effect goes through `system.run()`.
 */
import { system, world } from '@minecraft/server';
import { isGrave } from '../lifecycle';
import { authorize, consumeKey, refuse } from './auth';
import { restoreToPlayer } from './restore';
import { watchGrave } from './container';

export function initGate(): void {
  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target } = event;

    if (!isGrave(target)) {
      return;
    }

    const auth = authorize(player, target);

    if (!auth.allowed) {
      event.cancel = true;
      system.run(() => refuse(player));

      return;
    }

    if (player.isSneaking) {
      // Suppress the native screen and restore straight to the inventory.
      event.cancel = true;
      system.run(() => {
        if (!target.isValid || !player.isValid) {
          return;
        }

        if (auth.needsKey) {
          consumeKey(player);
        }

        restoreToPlayer(target, player);
      });

      return;
    }

    // Native container path: let the engine open the screen, then watch it.
    system.run(() => {
      if (!target.isValid || !player.isValid) {
        return;
      }

      if (auth.needsKey) {
        consumeKey(player);
      }

      watchGrave(target, player);
    });
  });
}
