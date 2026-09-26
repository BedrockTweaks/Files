/**
 * The grave key (§3a gate 2): held in either hand it opens any grave, and one
 * is consumed on success (creative players keep theirs). Given out with
 * /<ns>:gravekey. The display name resolves client-side from the addon's own
 * i18n key, so it follows each player's language.
 */
export default {
  'format_version': '1.21.0',
  'minecraft:item': {
    description: {
      identifier: 'bt:gc_graves.grave_key',
      menu_category: { category: 'items' },
    },
    components: {
      'minecraft:icon': 'bt.gc_graves.grave_key',
      'minecraft:glint': true,
      'minecraft:max_stack_size': 16,
      'minecraft:display_name': { value: 'bt_gc_graves.item.graveKey' },
    },
  },
} satisfies Item;
