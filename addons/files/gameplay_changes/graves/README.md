# Graves

When you die, a grave keeps everything — inventory, armor, offhand and XP. It
never burns, never explodes, floats on lava, and gets rescued from the void.

- **Interact** — opens the grave like a chest; it disappears once emptied.
- **Sneak + interact** — everything straight back into its original slots.
- **Hit it twice** — scatters the contents on the ground.

Only the owner can open a grave, unless grave robbing is enabled or the opener
holds a grave key (consumed on use).

## Commands

| Command | Who | What |
| --- | --- | --- |
| `/bt_gc_graves:graves` | anyone | your grave list |
| `/bt_gc_graves:config` | anyone | settings |
| `/bt_gc_graves:guide` | anyone | in-game guide |
| `/bt_gc_graves:gravekey [player] [amount]` | operator | hand out grave keys |
| `/bt_gc_graves:gravesadmin <action>` | operator | panel, purge, enable/disable |

## Development

```bash
yarn run watch  # live recompilation
yarn run build
yarn run lint
```

- Run a build once after cloning so the generated i18n/guides modules exist.
- Install the `core-ui-*.mcpack` in your test world to see the custom UI.
- The grave entity is unkillable by design; the only removal path is
  `entity.remove()` — never `/kill`, never `runCommand('kill ...')`.
- The grave index (world dynamic properties) is the source of truth; grave
  entities in unloaded chunks do not exist to `getEntities()`.
