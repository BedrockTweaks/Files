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
import { PROP_DISABLED, PROP_PREV_KEEP_INVENTORY } from '../constants';
import { i18n } from '../UI/i18n';

export const isAddonDisabled = (): boolean => world.getDynamicProperty(PROP_DISABLED) === true;

const snapshotAndEnforce = (): void => {
  // Remember the operator's original value once, so force-disable can put it back.
  if (world.getDynamicProperty(PROP_PREV_KEEP_INVENTORY) === undefined) {
    world.setDynamicProperty(PROP_PREV_KEEP_INVENTORY, world.gameRules.keepInventory);
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

  world.setDynamicProperty(PROP_DISABLED, undefined);
  snapshotAndEnforce();

  return true;
}

/**
 * gravesadmin disable/forcedisable — stop capturing and hand `keepInventory`
 * back with the operator's original value. Existing graves are left alone.
 * Returns the restored value.
 */
export function disableAddon(): boolean {
  const previous = world.getDynamicProperty(PROP_PREV_KEEP_INVENTORY);

  world.setDynamicProperty(PROP_DISABLED, true);
  world.setDynamicProperty(PROP_PREV_KEEP_INVENTORY, undefined);
  world.gameRules.keepInventory = previous === true;

  return previous === true;
}
