/**
 * §3c — there is no before-death event, so the addon owns `keepInventory`:
 * forced on while enabled, re-asserted if anything turns it off, and released
 * (restoring the operator's original value) through the gravesadmin escape
 * hatch. `gameRules` cannot be written in restricted/early execution, so
 * every write goes through `system.run()`.
 */
import { GameRule, system, world } from '@minecraft/server';
import { isOperator } from '@bedrock-core/server';
import { config } from '../registration';
import { worldState } from '../storage/documents';
import { i18n } from '../UI/i18n';

export const isAddonDisabled = (): boolean => worldState.get()?.disabled === true;

const snapshotAndEnforce = (): void => {
  // Remember the operator's original value once, so force-disable can put it back.
  if (worldState.get()?.previousKeepInventory === undefined) {
    worldState.patch({ previousKeepInventory: world.gameRules.keepInventory });
  }

  world.gameRules.keepInventory = true;
};

const warnOperators = (): void => {
  for (const player of world.getAllPlayers()) {
    if (isOperator(player)) {
      player.sendMessage(i18n.forPlayer(player).t($ => $.warn.keepInventoryReasserted));
    }
  }
};

export function initKeepInventory(): void {
  system.run(() => {
    if (!isAddonDisabled() && config.server.capture.enforceKeepInventory.get()) {
      snapshotAndEnforce();
    }
  });

  world.afterEvents.gameRuleChange.subscribe(({ rule }) => {
    if (rule !== GameRule.KeepInventory || isAddonDisabled()) {
      return;
    }

    if (!config.server.capture.enforceKeepInventory.get() || world.gameRules.keepInventory) {
      return;
    }

    system.run(() => {
      world.gameRules.keepInventory = true;
    });

    if (config.server.capture.warnOnGameRuleChange.get()) {
      warnOperators();
    }
  });
}

/** gravesadmin enable — re-arm capture, re-snapshotting the previous value first. */
export function enableAddon(): boolean {
  if (!isAddonDisabled()) {
    return false;
  }

  worldState.patch({ disabled: undefined });

  if (config.server.capture.enforceKeepInventory.get()) {
    snapshotAndEnforce();
  }

  return true;
}

/**
 * gravesadmin disable/forcedisable — stop capturing and hand `keepInventory`
 * back with the operator's original value. Existing graves are left alone.
 * Returns the restored value.
 */
export function disableAddon(): boolean {
  const previous = worldState.get()?.previousKeepInventory;

  worldState.patch({ disabled: true, previousKeepInventory: undefined });

  if (previous !== undefined) {
    world.gameRules.keepInventory = previous;
  }

  return previous === true;
}
