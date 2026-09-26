/**
 * The grave (§3a/§3b): ONE custom entity — an engine-persisted 41-slot
 * container (36 inventory + 5 equipment), frozen in place (no gravity, no
 * collision, no push), immune to everything. The damage sensor lets a
 * player's swing land (so entityHitEntity fires and weapons behave normally)
 * while dealing zero damage — the ONLY removal path is entity.remove() from
 * script. /kill does not work on graves; that is intended.
 */
export default {
  'format_version': '1.21.0',
  'minecraft:entity': {
    description: {
      identifier: 'bt:gc_graves.grave',
      is_spawnable: false,
      is_summonable: true,
      is_experimental: false,
      properties: {
        // Drives the RP shake animation; set from script on the first hit.
        'bt:shaking': { type: 'bool', default: false, client_sync: true },
      },
    },
    components: {
      'minecraft:inventory': {
        container_type: 'container',
        inventory_size: 41,
        // `private: true` also blocks the container screen from ever opening
        // (observed in-game; the docs only mention death drops), and
        // `restrict_to_owner` is an engine gate that would break the grave-key
        // and robbing paths. Both stay off: access control is OUR before-event
        // (open/gate.ts), and a grave cannot die, so nothing ever drops.
        private: false,
        restrict_to_owner: false,
        can_be_siphoned_from: false,
      },
      'minecraft:physics': { has_gravity: false, has_collision: false },
      'minecraft:pushable': { is_pushable: false, is_pushable_by_piston: false },
      'minecraft:knockback_resistance': { value: 1.0 },
      'minecraft:damage_sensor': {
        triggers: [
          {
            // Players: the hit lands (event fires, weapon durability applies), grave takes 0 damage.
            cause: 'entity_attack',
            deals_damage: 'no_but_side_effects_apply',
            on_damage: { filters: { test: 'is_family', subject: 'other', value: 'player' } },
          },
          // Everything else — creeper, TNT, lava, wither, void — nothing.
          { cause: 'all', deals_damage: 'no' },
        ],
      },
      'minecraft:health': { value: 1024, max: 1024 },
      'minecraft:collision_box': { width: 0.8, height: 0.9 },
      'minecraft:fire_immune': {},
      'minecraft:persistent': {},
      'minecraft:type_family': { family: ['grave', 'inanimate'] },
      'minecraft:nameable': { allow_name_tag_renaming: false, always_show: true },
      'minecraft:conditional_bandwidth_optimization': {},
    },
  },
} satisfies Entity;
