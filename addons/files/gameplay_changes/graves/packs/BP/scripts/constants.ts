/**
 * Identifiers shared across the addon. The bedrock-core namespace
 * (`bt_gc_graves`) prefixes commands, i18n keys and dynamic properties;
 * entity/item identifiers follow the repo's `bt:<pack>.<name>` convention.
 */
export const NAMESPACE = 'bt_gc_graves';

export const GRAVE_ENTITY = 'bt:gc_graves.grave';
export const GRAVE_KEY_ITEM = 'bt:gc_graves.grave_key';

/** Entity property (client_sync) driving the RP shake animation. */
export const SHAKING_PROPERTY = 'bt:shaking';

/** Dynamic-property keys on the grave entity. */
export const PROP_OWNER = `${NAMESPACE}:owner`;
export const PROP_OWNER_NAME = `${NAMESPACE}:ownerName`;
export const PROP_XP = `${NAMESPACE}:xp`;
export const PROP_CAUSE = `${NAMESPACE}:cause`;
export const PROP_KILLER = `${NAMESPACE}:killer`;
export const PROP_DIED_AT = `${NAMESPACE}:diedAt`;
export const PROP_SHAKE_UNTIL = `${NAMESPACE}:shakeUntilTick`;

/** World dynamic-property keys. */
export const PROP_IDX_PREFIX = `${NAMESPACE}:idx:`;
export const PROP_OWNERS = `${NAMESPACE}:owners`;
export const PROP_DISABLED = `${NAMESPACE}:disabled`;
export const PROP_PREV_KEEP_INVENTORY = `${NAMESPACE}:prevKeepInventory`;

/** Grave container layout: 0–35 mirror the player container, 36–40 equipment. */
export const GRAVE_INVENTORY_SIZE = 41;
export const PLAYER_CONTAINER_SLOTS = 36;

/** Ticks the grave keeps shaking after the first hit — the second-hit window. */
export const SHAKE_WINDOW_TICKS = 10;

/**
 * §3b-i layer 4 — vanilla blocks a grave must never occupy or replace.
 * Layers 1–3 (block tag, config list, RPC) extend this at runtime.
 */
export const VANILLA_IMPENETRABLE: ReadonlySet<string> = new Set([
  'minecraft:bedrock',
  'minecraft:barrier',
  'minecraft:command_block',
  'minecraft:chain_command_block',
  'minecraft:repeating_command_block',
  'minecraft:structure_block',
  'minecraft:structure_void',
  'minecraft:jigsaw',
  'minecraft:light_block',
  'minecraft:end_portal',
  'minecraft:end_portal_frame',
  'minecraft:end_gateway',
  'minecraft:allow',
  'minecraft:deny',
  'minecraft:border_block',
]);

/** Block tag other addons can put on their blocks to keep graves out (§3b-i layer 1). */
export const IMPENETRABLE_TAG = 'bt:gc_graves.impenetrable';

/** Entities a grave placement cell must not share (§3b rows 13–14). */
export const REPELLING_ENTITIES: ReadonlySet<string> = new Set([
  GRAVE_ENTITY,
  'minecraft:ender_crystal',
  'minecraft:shulker',
  'minecraft:armor_stand',
]);
