/**
 * Config schema (§5), declared via `core.register({ config })` in main.ts.
 * Every leaf becomes a widget in the shared bedrock-core config UI; labels and
 * descriptions are i18n keys resolved in each player's language. Exported as
 * a type so other addons can read it via `core.config.of<GravesConfigDef>()`.
 */
import { i18n } from './UI/i18n';

export const configDef = {
  server: {
    access: {
      $label: i18n.key($ => $.config.groups.access.label),
      $description: i18n.key($ => $.config.groups.access.desc),
      allowRobbing: {
        type: 'boolean',
        default: false,
        label: i18n.key($ => $.config.allowRobbing.label),
        description: i18n.key($ => $.config.allowRobbing.desc),
      },
      graveKeyEnabled: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.graveKeyEnabled.label),
        description: i18n.key($ => $.config.graveKeyEnabled.desc),
      },
    },
    contents: {
      $label: i18n.key($ => $.config.groups.contents.label),
      $description: i18n.key($ => $.config.groups.contents.desc),
      pickUpXp: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.pickUpXp.label),
        description: i18n.key($ => $.config.pickUpXp.desc),
      },
      xpPercent: {
        type: 'number',
        default: 100,
        min: 0,
        max: 100,
        step: 5,
        label: i18n.key($ => $.config.xpPercent.label),
        description: i18n.key($ => $.config.xpPercent.desc),
      },
      restoreToOriginalSlots: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.restoreToOriginalSlots.label),
        description: i18n.key($ => $.config.restoreToOriginalSlots.desc),
      },
    },
    capture: {
      $label: i18n.key($ => $.config.groups.capture.label),
      $description: i18n.key($ => $.config.groups.capture.desc),
      enforceKeepInventory: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.enforceKeepInventory.label),
        description: i18n.key($ => $.config.enforceKeepInventory.desc),
      },
      warnOnGameRuleChange: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.warnOnGameRuleChange.label),
        description: i18n.key($ => $.config.warnOnGameRuleChange.desc),
      },
    },
    lifetime: {
      $label: i18n.key($ => $.config.groups.lifetime.label),
      $description: i18n.key($ => $.config.groups.lifetime.desc),
      despawnSeconds: {
        type: 'number',
        default: 0,
        min: 0,
        max: 86400,
        step: 60,
        label: i18n.key($ => $.config.despawnSeconds.label),
        description: i18n.key($ => $.config.despawnSeconds.desc),
      },
      maxGravesPerPlayer: {
        type: 'number',
        default: 0,
        min: 0,
        max: 50,
        label: i18n.key($ => $.config.maxGravesPerPlayer.label),
        description: i18n.key($ => $.config.maxGravesPerPlayer.desc),
      },
      onLimitReached: {
        type: 'enum',
        default: 'drop_oldest',
        options: ['drop_oldest', 'block_new'],
        label: i18n.key($ => $.config.onLimitReached.label),
        description: i18n.key($ => $.config.onLimitReached.desc),
      },
    },
    protection: {
      $label: i18n.key($ => $.config.groups.protection.label),
      $description: i18n.key($ => $.config.groups.protection.desc),
      voidPlatform: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.voidPlatform.label),
        description: i18n.key($ => $.config.voidPlatform.desc),
      },
      voidRescueY: {
        type: 'number',
        default: -60,
        min: -64,
        max: 320,
        label: i18n.key($ => $.config.voidRescueY.label),
        description: i18n.key($ => $.config.voidRescueY.desc),
      },
      voidPlatformBlock: {
        type: 'enum',
        default: 'cobblestone_slab',
        options: ['cobblestone_slab', 'stone', 'obsidian'],
        label: i18n.key($ => $.config.voidPlatformBlock.label),
        description: i18n.key($ => $.config.voidPlatformBlock.desc),
      },
      floatOnLava: {
        type: 'boolean',
        default: true,
        label: i18n.key($ => $.config.floatOnLava.label),
        description: i18n.key($ => $.config.floatOnLava.desc),
      },
    },
    // At the scope root, beside only sections, so the config UI gives it a
    // real list editor instead of the stranded-in-a-form chat fallback.
    extraImpenetrableBlocks: {
      type: 'list',
      itemType: 'string',
      maxItems: 64,
      default: [],
      label: i18n.key($ => $.config.extraImpenetrableBlocks.label),
      description: i18n.key($ => $.config.extraImpenetrableBlocks.desc),
    },
  },
  player: {
    showDeathToast: {
      type: 'boolean',
      default: true,
      label: i18n.key($ => $.config.showDeathToast.label),
      description: i18n.key($ => $.config.showDeathToast.desc),
    },
    graveNameStyle: {
      type: 'enum',
      default: 'name',
      options: ['name', 'name_and_time', 'hidden'],
      label: i18n.key($ => $.config.graveNameStyle.label),
      description: i18n.key($ => $.config.graveNameStyle.desc),
    },
  },
} as const;

export type GravesConfigDef = typeof configDef;
