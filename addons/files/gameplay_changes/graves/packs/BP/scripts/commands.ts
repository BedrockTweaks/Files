/**
 * Custom commands. `ui(core)` already provides `<ns>:config`, `<ns>:configat`,
 * `<ns>:guide` and `<ns>:list`; these are the addon's own, and the namespace
 * is taken from `core.id` — never spelled by hand.
 *
 * Command callbacks may not touch the world, so every action defers into
 * `system.run()` and reports through chat rather than the command result.
 */
import {
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  EntityComponentTypes,
  ItemStack,
  system,
} from '@minecraft/server';
import type { CustomCommandOrigin, CustomCommandResult, Player } from '@minecraft/server';
import { config, core } from './registration';
import { GRAVE_KEY_ITEM } from './constants';
import { allRecords } from './index/store';
import { forcePurge, isForcePurgeRunning, pendingTombstones, purgeGraves } from './index/purge';
import { disableAddon, enableAddon, isAddonDisabled } from './death/keepInventory';
import { openAdminPanel, openGraveList } from './UI/GravesApp';
import { i18n } from './UI/i18n';
import { isPlayer } from './util';

const ADMIN_ACTIONS = ['panel', 'purge', 'purgestatus', 'forcepurge', 'enable', 'disable', 'forcedisable'] as const;

type AdminAction = typeof ADMIN_ACTIONS[number];

const asPlayer = (origin: CustomCommandOrigin): Player | undefined => (origin.sourceEntity && isPlayer(origin.sourceEntity) ? origin.sourceEntity : undefined);

const notAPlayer = (): CustomCommandResult => ({ status: CustomCommandStatus.Failure, message: i18n.t($ => $.cmd.notAPlayer) });

const giveKeys = (target: Player, amount: number): void => {
  const inventory = target.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;

  if (!inventory) {
    return;
  }

  const leftover = inventory.addItem(new ItemStack(GRAVE_KEY_ITEM, amount));

  if (leftover) {
    target.dimension.spawnItem(leftover, target.location);
  }
};

const runAdminAction = (player: Player, action: AdminAction, target?: Player): void => {
  const { t } = i18n.forPlayer(player);

  switch (action) {
    case 'panel': {
      openAdminPanel(player);
      break;
    }

    case 'purge': {
      const report = purgeGraves(target?.id);

      player.sendMessage(report.total === 0
        ? t($ => $.admin.purgedNone)
        : t($ => $.admin.purged, { total: report.total, removed: report.removed, tombstoned: report.tombstoned }));
      break;
    }

    case 'purgestatus': {
      player.sendMessage(t($ => $.admin.purgeStatus, { count: pendingTombstones() }));
      break;
    }

    case 'forcepurge': {
      if (isForcePurgeRunning()) {
        player.sendMessage(t($ => $.admin.forcePurgeBusy));
        break;
      }

      const pending = forcePurge((count) => {
        if (player.isValid) {
          player.sendMessage(i18n.forPlayer(player).t($ => $.admin.forcePurgeDone, { count }));
        }
      });

      player.sendMessage(pending === 0 ? t($ => $.admin.purgedNone) : t($ => $.admin.forcePurgeStart, { count: pending }));
      break;
    }

    case 'enable': {
      player.sendMessage(enableAddon() ? t($ => $.admin.enabled) : t($ => $.admin.alreadyEnabled));
      break;
    }

    case 'disable': {
      if (isAddonDisabled()) {
        player.sendMessage(t($ => $.admin.alreadyDisabled));
        break;
      }

      const count = allRecords().length;

      if (count > 0) {
        player.sendMessage(t($ => $.admin.refuseDisable, { count }));
        break;
      }

      player.sendMessage(t($ => $.admin.disabled, { value: String(disableAddon()) }));
      break;
    }

    case 'forcedisable': {
      if (isAddonDisabled()) {
        player.sendMessage(t($ => $.admin.alreadyDisabled));
        break;
      }

      player.sendMessage(t($ => $.admin.disabled, { value: String(disableAddon()) }));
      break;
    }
  }
};

export function initCommands(): void {
  system.beforeEvents.startup.subscribe(({ customCommandRegistry: registry }) => {
    const ns = core.id;

    registry.registerEnum(`${ns}:adminaction`, [...ADMIN_ACTIONS]);

    registry.registerCommand({
      name: `${ns}:graves`,
      description: i18n.t($ => $.cmd.graves),
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false,
    }, (origin) => {
      const player = asPlayer(origin);

      if (!player) {
        return notAPlayer();
      }

      system.run(() => openGraveList(player));

      return { status: CustomCommandStatus.Success };
    });

    registry.registerCommand({
      name: `${ns}:gravekey`,
      description: i18n.t($ => $.cmd.gravekey),
      permissionLevel: CommandPermissionLevel.Admin,
      cheatsRequired: false,
      optionalParameters: [
        { name: 'player', type: CustomCommandParamType.PlayerSelector },
        { name: 'amount', type: CustomCommandParamType.Integer },
      ],
    }, (origin, targets?: Player[], amount?: number) => {
      const player = asPlayer(origin);
      const receivers = targets && targets.length > 0 ? targets : player ? [player] : [];

      if (receivers.length === 0) {
        return notAPlayer();
      }

      const count = Math.min(Math.max(amount ?? 1, 1), 16);

      system.run(() => {
        if (!config.server.access.graveKeyEnabled.get()) {
          player?.sendMessage(i18n.forPlayer(player).t($ => $.cmd.keyDisabled));

          return;
        }

        for (const target of receivers) {
          if (target.isValid) {
            giveKeys(target, count);
            player?.sendMessage(i18n.forPlayer(player).t($ => $.cmd.keyGiven, { count, player: target.name }));
          }
        }
      });

      return { status: CustomCommandStatus.Success };
    });

    registry.registerCommand({
      name: `${ns}:gravesadmin`,
      description: i18n.t($ => $.cmd.gravesadmin),
      permissionLevel: CommandPermissionLevel.Admin,
      cheatsRequired: false,
      mandatoryParameters: [
        { name: `${ns}:adminaction`, type: CustomCommandParamType.Enum },
      ],
      optionalParameters: [
        { name: 'player', type: CustomCommandParamType.PlayerSelector },
      ],
    }, (origin, action: AdminAction, targets?: Player[]) => {
      const player = asPlayer(origin);

      if (!player) {
        return notAPlayer();
      }

      system.run(() => runAdminAction(player, action, targets?.[0]));

      return { status: CustomCommandStatus.Success };
    });
  });
}
