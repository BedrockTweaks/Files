/** Shared pack identifiers and fixed inventory layout. */
export const GRAVE_ENTITY = 'bt:gc_graves.grave';
export const GRAVE_KEY_ITEM = 'bt:gc_graves.grave_key';

/** Entity property (client_sync) driving the RP shake animation. */
export const SHAKING_PROPERTY = 'bt:shaking';

/**
 * Grave storage order: the player's main inventory (slots 9–35) fills rows 1–3,
 * the hotbar (slots 0–8) fills row 4, and equipment follows at slots 36–40.
 */
export const GRAVE_INVENTORY_SIZE = 41;
export const PLAYER_CONTAINER_SLOTS = 36;
export const PLAYER_HOTBAR_SLOTS = 9;

/** Convert a player inventory slot into its row-ordered grave slot. */
export const graveSlotForPlayerSlot = (playerSlot: number): number => (
  playerSlot < PLAYER_HOTBAR_SLOTS
    ? PLAYER_CONTAINER_SLOTS - PLAYER_HOTBAR_SLOTS + playerSlot
    : playerSlot - PLAYER_HOTBAR_SLOTS
);

/** Convert a row-ordered grave slot back into the player's inventory slot. */
export const playerSlotForGraveSlot = (graveSlot: number): number => (
  graveSlot < PLAYER_CONTAINER_SLOTS - PLAYER_HOTBAR_SLOTS
    ? graveSlot + PLAYER_HOTBAR_SLOTS
    : graveSlot - (PLAYER_CONTAINER_SLOTS - PLAYER_HOTBAR_SLOTS)
);

/** Locator bar (§8) — the grave icon shipped in the RP, and its bar tint. */
export const WAYPOINT_TEXTURE = 'textures/ui/grave_waypoint';
export const WAYPOINT_COLOR = { red: 0.62, green: 0.62, blue: 0.66 };
