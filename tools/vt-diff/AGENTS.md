# vt-diff — agent playbook

This tool is **initiated by a developer**, not by an agent on a schedule. The developer runs the
scripts; agents do the two passes that scripts cannot do — reconciling names and researching Bedrock
feasibility — and then stop. A human performs the final `--apply`.

Read [README.md](./README.md) first for what each script does. This file is about the judgement
calls between the scripts.

## Non-negotiable rules

1. **Never run `issues.mjs --apply`.** Present the plan and stop. Only a developer applies it.
2. **Never add an alias you have not verified against the filesystem.** A matching name is not proof.
3. **Never record a feasibility verdict without a source URL.** `feasibility.mjs --validate` rejects
   unsourced verdicts, but the point is to not write them in the first place.
4. **Never edit anything between `<!-- vt-diff:start -->` and `<!-- vt-diff:end -->` by hand.** It is
   regenerated on every run.
5. **`unknown` is a valid answer.** A wrong verdict is worse than an unanswered one, because it ships
   to a public issue with a confidence label attached.
6. **Do not edit `report.json`, `issue-plan.json` or anything in `out/`.** They are build artefacts.
   Fix the inputs — `aliases.json`, `ignore.json`, `feasibility.json` — and rerun.

## The pipeline

```
fetch.mjs ─→ diff.mjs ─→ [ PASS A: aliases ] ─→ diff.mjs ─→ feasibility.mjs
                                                                  │
                                                    [ PASS B: research ]
                                                                  │
                                                            issues.mjs
                                                                  │
                                                    [ PASS C: review ] ─→ human --apply
```

Passes A and B are agent work. Pass C is an agent preparing a decision for a human.

---

# Pass A — alias reconciliation

## Why this pass exists

The two projects name the same pack differently, in ways no string algorithm resolves safely.

Vanilla Tweaks stores `name` (a PascalCase or lowercase-spaced key) and `display` (the human label).
Bedrock Tweaks stores `id` (snake_case) and `name` (the human label). `diff.mjs` strips everything
except letters and digits before comparing, so `AlternateBlockDestruction`,
`Alternate Block Destruction` and `alternate_block_destruction` all collapse to one key and match
automatically. That handles most of the catalogue.

It fails whenever we reworded the pack. Real cases from this repo:

| Vanilla Tweaks | Bedrock Tweaks | Why the match failed |
| --- | --- | --- |
| `PotterySherdToShard` — "Rename 'Pottery Sherd' to 'Pottery Shard'" | `rename_pottery_sherds_to_pottery_shards` | Pluralisation |
| `ClassicSheep` — "Classic Sheep" | `classic_java_sheep` — "Classic Java Sheep" | We added a qualifier |
| `PackPngPanorama` — "pack.png Panorama" | `pack_panorama` — "Pack Panorama" | We simplified the wording |
| `blackstone cobblestone` — "Blackstone Cobblestone" | `alternate_cobblestone` — "Alternate Cobblestone" | Ours is a superset (Blackstone **and** Cobbled Deepslate) |
| `UniversalLushGrass` — "Lush Grass (Mostly) All 'Round!" | `lush_grass_all_round` — "Lush Grass All 'Round!" | We dropped a parenthetical |
| `ColoredXpBarsBrown` — "Brown Experience Bar" | `brown_xp_bar` — **"Brown Elytra"** | A typo in our own `packs.json` |

That last row is the reason this pass is not busywork. The mismatch surfaced a live data bug on the
site. Treat every unmatched pack as either a missing port **or** a defect in our metadata.

## Procedure

1. Run `node tools/vt-diff/diff.mjs`, then read `out/report.json`.
2. Work through `sections[*].missing[]`. Entries with a non-empty `suggestions` array are the
   likely renames — `suggestions` is a Levenshtein shortlist against our pack names, capped by
   `suggestionMaxDistance` in `config.json`.
3. Also scan `sections[*].bedrockOnly[]`. A rename shows up on **both** lists: missing on one side,
   unmatched on the other. Cross-referencing the two lists catches renames the distance metric
   misses, such as `blackstone cobblestone` ↔ `alternate_cobblestone`.
4. For each candidate, confirm all three before writing an alias:
   - the id exists in `<section>/packs.json`;
   - a directory for it exists under `<section>/files/`;
   - the descriptions describe the same behaviour.
5. Write the alias into `aliases.json` under the correct section. Key is the Vanilla Tweaks `name`,
   value is our `id`.
6. Rerun `node tools/vt-diff/diff.mjs` and confirm both counts moved: `missing` down by one,
   `bedrockOnly` down by one.

## When it is not an alias

- **Our pack is a superset or subset.** Still alias it, and say so in your report — the maintainer
  may want the remaining coverage tracked as a separate issue. `alternate_cobblestone` covers
  Blackstone plus Cobbled Deepslate, so aliasing is correct and nothing is lost.
- **Similar name, different subject.** `VariatedNylium` is not `variated_mycelium`. Different block.
  Leave it missing.
- **Our metadata is wrong.** Do not paper over it with an alias. Report the defect so `packs.json`
  gets fixed. `brown_xp_bar` needed both — a name fix *and* an alias, because the Vanilla Tweaks
  `name` key (`ColoredXpBarsBrown`) would not match our id even after the display name was corrected.
- **Genuinely absent.** Most of the list. Leave it alone; Pass B picks it up.

## Reporting

Report the aliases added, the near-misses you rejected and why, and any metadata defects found.
Rejected candidates matter — they stop the next agent re-investigating the same pairs.

---

# Pass B — Bedrock feasibility research

## Why this pass exists

Vanilla Tweaks targets Java Edition. A large share of its catalogue depends on capabilities Bedrock
resource packs do not expose, or exposes differently. Opening 116 issues that all read "port this
pack" without saying whether it is *portable* creates work for contributors and false expectations
for users.

The output of this pass is a verdict per pack, with evidence, stored in `feasibility.json`. That
verdict drives the labels `issues.mjs` applies and a "Bedrock feasibility" section in the issue body.

## Getting a worklist

```sh
node tools/vt-diff/feasibility.mjs
```

Writes `out/feasibility-todo.md` and `out/feasibility-batches/batch-NN.json` — chunks of
`feasibility.batchSize` packs. Hand exactly one batch file to one agent. Batches are independent, so
run them in parallel; merge the results into `feasibility.json` afterwards.

Packs already carrying a verdict other than `unknown` are excluded, so the worklist shrinks as
research lands and reruns are cheap.

## Source hierarchy

Work down this list. Stop at the highest tier that answers the question, and cite what you used.

**Tier 1 — authoritative.**

- The `microsoft-learn` MCP server (configured in the repo's `.mcp.json`, endpoint
  `https://learn.microsoft.com/api/mcp`). Canonical for the add-on JSON schemas, block/entity/item
  components, the Script API and resource pack structure. Prefer it over web search for anything
  Microsoft documents.
- [`github.com/Mojang/bedrock-samples`](https://github.com/Mojang/bedrock-samples) — the shipped
  vanilla resource and behaviour packs. The single best answer to "is this texture, model, UI file
  or JSON control point actually there?" is to look for the file. Raw files are fetchable directly.

**Tier 2 — community, high quality.**

- [`wiki.bedrock.dev/llms.txt`](https://wiki.bedrock.dev/llms.txt) — an index of the Bedrock Wiki
  written for machine consumption. Fetch it first to pick pages, then fetch the raw Markdown:
  replace `https://wiki.bedrock.dev/` with
  `https://raw.githubusercontent.com/Bedrock-OSS/bedrock-wiki/refs/heads/wiki/docs/` and append
  `.md`. Sections most relevant here: **Visuals**, **Blocks → Sound & Visuals**, **JSON UI**,
  **Particles**, **Entities → Render Controllers**, **Concepts → Shaders / Texture Atlases**,
  **Text & Localization**.
- This machine's Bedrock JSON UI knowledge base, for anything touching HUD, menus, forms or
  `ui_defs.json`. Its `AGENTS.md` is the routing entry point.

**Tier 3 — corroborating only.**

- `bugs.mojang.com` and `feedback.minecraft.net` — useful for "this is a known Bedrock limitation"
  or "this is planned". Never the sole source for a `blocked` verdict.
- `minecraft.wiki` — good for confirming what the Java pack actually changes, which is often the
  harder half of the question.

Hosts outside `feasibility.trustedSourceHosts` in `config.json` are rejected by the validator. If you
need a new host, propose it to the developer rather than editing the allowlist yourself.

## What to actually determine

For each pack, answer in this order:

1. **What does the Java pack change?** Read the Vanilla Tweaks description in the batch file and
   look at the icon URL. If the description is ambiguous, confirm against `minecraft.wiki` what the
   vanilla asset is. Getting this wrong invalidates everything downstream.
2. **Which Bedrock subsystem would have to deliver it?** Textures, block models, entity geometry,
   render controllers, particles, JSON UI, fonts and glyphs, sounds, text and localization, or a
   behaviour pack / Script API add-on.
3. **Does that subsystem expose the necessary control point in a resource pack?** This is the
   question the sources answer. Be specific — "block models can be overridden" is not the same as
   "the geometry of a *vanilla* block can be replaced by a resource pack alone".
4. **Does it need a behaviour pack?** If yes it is not a resource pack port; it belongs in
   `addons`. Say so — the section may need to change.
5. **Is there a version floor or a platform caveat?** Note it in `caveats`.

## Verdict rubric

| Verdict | Use when | Effect |
| --- | --- | --- |
| `possible` | A resource pack (or, for `addons`, an add-on) can reproduce the effect with no meaningful loss. You can name the mechanism. | Labelled `enhancement` |
| `partial` | Reproducible but degraded, or only under conditions — a version floor, a platform gap, an approximation. | Labelled `enhancement`, `help wanted` |
| `blocked` | Bedrock does not expose the required control point. You have a source stating the limitation, or you demonstrated the asset or hook is absent from `bedrock-samples`. | Labelled `not_possible` |
| `unknown` | You could not establish it within the batch. **The correct answer when unsure.** | Labelled `enhancement`, stays on the worklist |

`confidence` is about your evidence, not the outcome. Tier 1 source stating it outright is `high`.
Tier 2 tutorial demonstrating the technique is `medium`. Inference from adjacent facts is `low` —
and `low` confidence on a `blocked` verdict should usually be `unknown` instead.

## Evidence standard

`blocked` is the verdict that costs us. It tells a contributor not to try, and tells a user we will
never ship it. It requires either an explicit statement of the limitation from a Tier 1 or Tier 2
source, or a concrete demonstration that the required file, component or binding does not exist in
`bedrock-samples`.

"I could not find documentation showing it is possible" is **not** evidence of impossibility. That is
`unknown`.

Bedrock's capabilities move. A verdict older than a couple of releases is a hypothesis, not a fact —
which is why `checkedAt` is mandatory.

## Recording a verdict

Add to `feasibility.json` under the section, keyed by the Vanilla Tweaks `name`:

```json
"SomePackName": {
	"verdict": "partial",
	"confidence": "medium",
	"summary": "One sentence a maintainer can act on without opening anything else.",
	"mechanism": "How it would actually be built on Bedrock, naming the specific files or components — or exactly what is missing.",
	"caveats": "Optional. Version floor, platform differences, what is lost versus Java.",
	"sources": ["https://wiki.bedrock.dev/...", "https://learn.microsoft.com/..."],
	"checkedAt": "2026-07-25",
	"checkedBy": "agent"
}
```

Then validate:

```sh
node tools/vt-diff/feasibility.mjs --validate
```

It checks the verdict enum, required prose fields, the date format, source count and source hosts.
Fix every problem before handing back.

`summary` and `mechanism` are published verbatim into public GitHub issues. Write them for a
contributor deciding whether to pick the pack up, not as notes to yourself.

## Batch protocol

- One batch file per agent. Do not split a batch across agents, and do not merge batches.
- Each agent returns a JSON fragment for its packs only. The coordinating agent merges fragments
  into `feasibility.json` and runs `--validate` once at the end.
- On a merge conflict for the same pack, keep the higher-confidence entry; if confidence ties, keep
  the one with more Tier 1 sources.
- Report per batch: verdict counts, and every pack left `unknown` with what specifically blocked you.

---

# Pass C — issue plan review

```sh
node tools/vt-diff/issues.mjs
```

Read `out/issue-plan.md`, then verify before presenting it:

1. **`reopenCandidates`** — closed as completed, yet absent from `packs.json`. Check
   `<section>/files/` for each. Either an alias is missing (Pass A) or a port was lost. This bucket
   found issue #927 "Glowier Glow": closed as done, no pack, no files.
2. **`rejected`** — closed as not planned. These are decisions already made. `--seed-ignore` copies
   them into `ignore.json` with the issue number as the reason; replace those placeholder reasons
   with the real rationale, and record a `blocked` verdict where one applies.
3. **`close`** — the pack now exists. Confirm the issue is a *request*, not a bug report about a
   shipped pack. The filters in `config.json` (`closeRequiresLabels`, `closeExcludesLabels`) already
   exclude bugs; verify the survivors anyway.
4. **`create`** — check the generated titles match the repo convention, `[Category > Sub] Pack Name`.
   A Vanilla Tweaks category whose own name contains brackets will produce a nested-bracket title;
   that is a signal the category needs a group or an `ignore.json` entry, not a title patch.
5. **`groupConflicts`** — a pack collapsed into a grouped issue that already has its own open issue.
   Non-empty means something would be tracked twice. Either fold the existing issue into the group
   and close it, or drop the group from `config.json`. Never apply with this bucket populated.
6. **Feasibility coverage** — the plan prints how many planned packs still have no verdict. Applying
   with a large unresearched count publishes issues that say "not researched yet". Say so plainly.
   Coverage counts packs, not issues, so a grouped family cannot flatter the number.

Then stop. Present counts, the verified `reopenCandidates`, and anything that looks wrong. Ask the
developer to approve. Do not apply.

---

## Definition of done

- [ ] `diff.mjs` rerun after the last `aliases.json` edit
- [ ] Every alias verified against `packs.json` **and** `<section>/files/`
- [ ] `feasibility.mjs --validate` exits clean
- [ ] Every `blocked` verdict carries an explicit source for the limitation
- [ ] Every `unknown` reported with the reason it stayed unknown
- [ ] `reopenCandidates` checked against the filesystem, not assumed
- [ ] Metadata defects found along the way reported separately, not silently aliased
- [ ] `--apply` **not** run
