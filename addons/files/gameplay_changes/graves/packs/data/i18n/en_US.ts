/**
 * Default locale — the shape contract. Every other locale (es_ES.ts) must
 * carry exactly this key set. `meta.*` feeds the pack manifests and the
 * bedrock-core registry; `config.*` keys are the schema labels/descriptions.
 */
export default {
  meta: {
    name: 'Graves',
    description: 'When you die, a grave saves all your drops. Open it to get them back.',
    creator: 'Bedrock Tweaks, DrAv0011',
  },
  config: {
    groups: {
      access: {
        label: 'Access',
        desc: 'Who may open whose graves, and how.',
      },
      contents: {
        label: 'Contents',
        desc: 'What a grave stores and how it hands it back.',
      },
      capture: {
        label: 'Capture',
        desc: 'The keepInventory contract that makes capture lossless.',
      },
      lifetime: {
        label: 'Lifetime',
        desc: 'Despawning and the per-player grave cap.',
      },
      protection: {
        label: 'Placement',
        desc: 'Where graves may stand: lava, the void, forbidden blocks.',
      },
    },
    allowRobbing: {
      label: 'Allow Grave Robbing',
      desc: 'When enabled, anyone can open anyone else\'s grave without a key.',
    },
    allowLocating: {
      label: 'Show Graves On Locator Bar',
      desc: 'When enabled, each player sees their own graves as waypoints on the locator bar.',
    },
    graveKeyEnabled: {
      label: 'Grave Key',
      desc: 'When enabled, a grave key in either hand opens any grave (one key is consumed).',
    },
    pickUpXp: {
      label: 'Collect XP',
      desc: 'Graves store the XP you had when you died.',
    },
    xpPercent: {
      label: 'XP Kept (%)',
      desc: 'Percentage of your XP the grave stores.',
    },
    restoreToOriginalSlots: {
      label: 'Restore Original Slots',
      desc: 'Sneak-opening a grave puts items back into the slots they were in.',
    },
    enforceKeepInventory: {
      label: 'Enforce keepInventory',
      desc: 'Graves needs the keepInventory gamerule and re-enables it if something turns it off.',
    },
    warnOnGameRuleChange: {
      label: 'Warn On Gamerule Change',
      desc: 'Tell operators when Graves re-enables keepInventory.',
    },
    despawnSeconds: {
      label: 'Despawn Time (seconds)',
      desc: 'Graves older than this are deleted with their contents. 0 disables despawning.',
    },
    maxGravesPerPlayer: {
      label: 'Max Graves Per Player',
      desc: 'Cap on simultaneous graves per player. 0 means unlimited.',
    },
    onLimitReached: {
      label: 'When The Cap Is Reached',
      desc: 'drop_oldest deletes the oldest grave; block_new skips the grave so you keep your items.',
    },
    voidPlatform: {
      label: 'Void Rescue Platform',
      desc: 'Place a single block under a grave that would otherwise fall into the void.',
    },
    voidRescueY: {
      label: 'Void Rescue Height',
      desc: 'Y level where void graves (and their platform) are placed.',
    },
    voidPlatformBlock: {
      label: 'Void Platform Block',
      desc: 'The block used for the void rescue platform.',
    },
    floatOnLava: {
      label: 'Float On Lava',
      desc: 'Graves float on lava source blocks instead of sinking to the bottom.',
    },
    extraImpenetrableBlocks: {
      label: 'Extra Impenetrable Blocks',
      desc: 'Block ids a grave must never occupy or replace, in addition to the built-in list.',
    },
    showDeathToast: {
      label: 'Show Grave Location On Death',
      desc: 'Get a chat message with your grave\'s coordinates when you die.',
    },
    showOnLocatorBar: {
      label: 'My Graves On Locator Bar',
      desc: 'Show your own graves as waypoints on your locator bar.',
    },
    graveNameStyle: {
      label: 'Grave Name Tag',
      desc: 'What the floating name over your graves shows.',
    },
  },
  cmd: {
    graves: 'Graves: open your grave list.',
    gravekey: 'Graves: give a grave key.',
    gravesadmin: 'Graves: admin panel, purge and enable/disable.',
    notAPlayer: 'This command must be run by a player.',
    keyGiven_one: 'Gave {{count}} grave key to {{player}}.',
    keyGiven_other: 'Gave {{count}} grave keys to {{player}}.',
    keyDisabled: 'The grave key is disabled in the config.',
  },
  death: {
    toast: 'Your grave is at {{x}}, {{y}}, {{z}} in {{dimension}}.',
    floating: 'Your grave is floating over the void at {{x}}, {{y}}, {{z}} — approach with care.',
    fallback: 'Your grave could not be placed where you died; it was moved to spawn at {{x}}, {{y}}, {{z}}.',
    capBlocked: 'You already have {{count}} graves, so no new grave was made — your items stayed with you.',
    capDropped: 'You were over the grave cap, so your oldest grave was removed.',
  },
  open: {
    robbingDisabled: 'Grave robbing is disabled.',
    tip: 'Tip: sneak + interact to load a grave straight into your inventory.',
    restored: 'Your items are back where they belong.',
    overflow_one: '{{count}} item did not fit and was dropped at your feet.',
    overflow_other: '{{count}} items did not fit and were dropped at your feet.',
    xp: 'Recovered {{amount}} XP.',
    keyConsumed: 'The grave key crumbles to dust.',
  },
  grave: {
    name: '{{owner}}\'s Grave',
  },
  item: {
    graveKey: 'Grave Key',
  },
  dim: {
    overworld: 'Overworld',
    nether: 'Nether',
    the_end: 'The End',
  },
  time: {
    now: 'just now',
    minutes: '{{m}}m ago',
    hours: '{{h}}h {{m}}m ago',
    days: '{{d}}d {{h}}h ago',
  },
  list: {
    waypointHint: 'Tick a grave to show it on your locator bar.',
    title: 'Your Graves',
    empty: 'You have no graves. Lucky you!',
    row_one: '{{count}} item — {{xp}} XP',
    row_other: '{{count}} items — {{xp}} XP',
    floating: 'floating over the void',
  },
  detail: {
    title: 'Grave',
    owner: 'Owner',
    dimension: 'Dimension',
    position: 'Position',
    items_one: '{{count}} item',
    items_other: '{{count}} items',
    xp: '{{amount}} XP',
    when: 'When',
    slainBy: 'Slain by {{killer}}',
    cause: 'Cause: {{cause}}',
    pendingPurge: 'Marked for deletion — it disappears when its chunk next loads.',
    teleport: 'Teleport',
    purge: 'Purge',
  },
  admin: {
    title: 'All Graves',
    empty: 'No graves anywhere in this world.',
    enabled: 'Graves enabled — keepInventory is now enforced again.',
    disabled: 'Graves disabled — keepInventory was restored to {{value}}.',
    refuseDisable_one: '{{count}} grave still exists. Empty it first, or use forcedisable.',
    refuseDisable_other: '{{count}} graves still exist. Empty them first, or use forcedisable.',
    alreadyEnabled: 'Graves is already enabled.',
    alreadyDisabled: 'Graves is already disabled.',
    purged: 'Purged {{total}} graves ({{removed}} removed now, {{tombstoned}} tombstoned — they are deleted when their chunks next load).',
    purgedNone: 'Nothing to purge.',
    purgeStatus_one: '{{count}} grave is tombstoned and waiting for its chunk to load.',
    purgeStatus_other: '{{count}} graves are tombstoned and waiting for their chunks to load.',
    forcePurgeStart_one: 'Force-purging {{count}} grave with a ticking area — this may take a while.',
    forcePurgeStart_other: 'Force-purging {{count}} graves with a ticking area — this may take a while.',
    forcePurgeDone: 'Force purge finished: {{count}} graves physically removed.',
    forcePurgeBusy: 'A force purge is already running.',
  },
  warn: {
    keepInventoryReasserted: 'Graves re-enabled the keepInventory gamerule. Disable the addon with /bt_gc_graves:gravesadmin forcedisable if that is not wanted.',
  },
} as const;
