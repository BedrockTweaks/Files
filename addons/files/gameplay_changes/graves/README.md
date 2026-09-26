# Graves

Work in progress. Graves is not available for download yet.

When you die, a grave keeps everything — inventory, armor, offhand and XP. It
never burns, never explodes, floats on lava, and gets rescued from the void.

- **Interact** — opens the grave like a chest; it disappears once emptied.
- **Sneak + interact** — everything straight back into its original slots.
- **Hit it twice** — scatters the contents on the ground.

Only the owner can open a grave, unless grave robbing is enabled or the opener
holds a grave key (consumed on use).

Your own graves show as waypoints on the locator bar (owner only, both a
server-wide and a per-player toggle).

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
yarn regolith-install  # install the pinned build filters
yarn run watch  # live recompilation
yarn run build
yarn run lint
```

- Run a build after cloning so the generated i18n, guides and UI modules exist.
- The GameTest suite in `packs/BP/scripts/tests/index.ts` requires a locally
  configured `bc-bds` runner and `bds-runner.json` before `yarn test` can run.
- Install the `core-ui-*.mcpack` in your test world to see the custom UI.
- The grave entity is unkillable by design; the only removal path is
  `entity.remove()` — never `/kill`, never `runCommand('kill ...')`.
- `scripts/storage/documents.ts` declares the entity documents, world grave
  directory and world state. The directory keeps graves discoverable while
  their entities are unloaded; entity documents allow recovery on chunk load.
- `scripts/main.ts` initializes registration, documents and gameplay listeners.
  `scripts/UI/navigation.tsx` opens the list, detail and administration screens.
- `grave_container.screen.tsx` owns the 41 inventory cells. Container callbacks
  update item totals and award XP when emptied; framework protocol slots are
  excluded from inventory operations.

## Placement extensions

Operators can edit **Extra Impenetrable Blocks** and **Extra Repelling Entities**
in settings. IDs without a namespace use `minecraft:`.

Other add-ons can call `registerImpenetrable({ ids })` and
`registerRepelling({ ids })` through `core.rpc.typed<GravesRPC>('bt_gc_graves')`.
Registration deduplicates IDs and returns the runtime set size. Register on each
world session; operator lists are persisted by the config app.

The block tag `bt:gc_graves.impenetrable` prevents placement in that block.
The entity tag `bt:gc_graves.repelling` prevents sharing that entity's block cell.
