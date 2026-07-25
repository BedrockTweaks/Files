# vt-diff

Parity tracker between [Vanilla Tweaks](https://vanillatweaks.net) and Bedrock Tweaks.

It answers three questions on demand:

1. Which Vanilla Tweaks packs do we not ship yet?
2. Which of those are actually buildable on Bedrock?
3. Are the GitHub issues that track them up to date?

A developer starts it. Scripts do the mechanical work; agents do the two passes that need judgement
— reconciling renamed packs and researching Bedrock feasibility — and a human performs the final
apply. **The agent procedure is [AGENTS.md](./AGENTS.md); read it before running an agent against
this tool.**

Nothing is written to GitHub unless you pass `--apply`.

## Usage

```sh
node tools/vt-diff/fetch.mjs        # download the Vanilla Tweaks catalogs into .cache/
node tools/vt-diff/diff.mjs         # write out/report.json and out/report.md
node tools/vt-diff/feasibility.mjs  # write the research worklist and per-agent batch files
node tools/vt-diff/issues.mjs       # write out/issue-plan.json and out/issue-plan.md (dry run)

node tools/vt-diff/issues.mjs --apply           # create, update and close issues
node tools/vt-diff/issues.mjs --seed-ignore     # copy "closed as not planned" packs into ignore.json
node tools/vt-diff/feasibility.mjs --validate   # check every recorded verdict
node tools/vt-diff/diff.mjs --section=addons    # limit the diff to one section
```

Or via yarn: `yarn vt:diff`, `yarn vt:feasibility`, `yarn vt:issues`.

`fetch.mjs`, `diff.mjs` and `feasibility.mjs` need no credentials. `issues.mjs` reads issues through
`gh` when it is authenticated and falls back to the public GitHub REST API otherwise, so dry runs
always work. `--apply` requires `gh auth login`.

`.cache/` and `out/` are ignored by git. Everything else in this directory is checked in.

## The full loop

```
fetch ─→ diff ─→ [agent: aliases] ─→ diff ─→ feasibility ─→ [agent: research] ─→ issues ─→ [human: --apply]
```

## How packs are matched

A Vanilla Tweaks pack is considered shipped when any of these resolve to a pack in `packs.json`:

1. an explicit entry in `aliases.json`,
2. the Vanilla Tweaks `name` compared against our `id` or `name`,
3. the Vanilla Tweaks `display` compared against our `id` or `name`.

Comparison strips everything except letters and digits, so `AlternateBlockDestruction`,
`Alternate Block Destruction` and `alternate_block_destruction` are the same key.

Vanilla Tweaks category trails map onto our category ids by slugging each segment and joining with
`/` — `GUI > Crosshairs` becomes `gui/crosshairs`. Matched packs sitting in a different category are
reported as **category drift**.

## The three files you maintain

`aliases.json` — a pack we already ship under a different name. Add an entry whenever the report
lists something as missing that you know exists. Most packs need one: the two projects use different
id formats and often different wording, so automatic matching only carries the identically-named
majority. See [AGENTS.md](./AGENTS.md#pass-a--alias-reconciliation) for the failure classes and the
verification each alias requires.

`ignore.json` — a pack that will never be ported, with the reason. `--seed-ignore` populates this
from issues closed as *not planned*.

`feasibility.json` — the Bedrock feasibility verdict per pack, with sources. Populated by the agent
research pass. Drives issue labels and the feasibility section of every managed issue body.
`feasibility.mjs --validate` rejects entries that are unsourced, undated or use an untrusted host.

All three are committed so the whole team shares one answer.

## Feasibility verdicts

| Verdict | Meaning | Labels applied |
| --- | --- | --- |
| `possible` | Buildable on Bedrock with no meaningful loss | `enhancement` |
| `partial` | Buildable but degraded or conditional | `enhancement`, `help wanted` |
| `blocked` | Bedrock does not expose what it needs | `not_possible` |
| `unknown` | Not researched, or research was inconclusive | `enhancement` |

Configured under `feasibility.verdictLabels` in `config.json`. `feasibility.skipCreateVerdicts`
controls which verdicts are excluded from issue creation entirely — empty by default, so `blocked`
packs still get a documented issue explaining why.

## Report buckets

| Bucket | Meaning |
| --- | --- |
| `missing` | On Vanilla Tweaks, not on Bedrock Tweaks, not ignored |
| `matched` | Shipped on both |
| `bedrockOnly` | Our own packs, no Vanilla Tweaks equivalent |
| `ignored` | Listed in `ignore.json` |
| `categoryDrift` | Shipped, but filed under a different category than Vanilla Tweaks |

## Issue plan buckets

| Bucket | `--apply` behaviour |
| --- | --- |
| `create` | Opens an issue titled `[Category > Sub] Pack Name` with verdict-derived labels |
| `update` | Refreshes the managed block in an open issue and adds any missing labels |
| `close` | Closes an open `enhancement` issue whose pack now exists |
| `skipped` | Not created, because its verdict is in `skipCreateVerdicts` |
| `reopenCandidates` | **Report only** — closed as completed, yet still absent from `packs.json` |
| `rejected` | **Report only** — closed as not planned; feed into `ignore.json` |
| `groupConflicts` | **Report only** — a grouped pack that also has its own open issue |

## Grouped colour families

Some Vanilla Tweaks categories ship the same pack once per colour. One issue per colour is noise, so
`issues.groups` in `config.json` collapses a whole category into a single issue carrying a checklist
of members — ticked once each one ships.

```json
{
	"id": "gui/tooltips",
	"section": "resource_packs",
	"category": "gui/tooltips",
	"title": "[GUI > Tooltips] Colored Tooltips",
	"note": "Shown above the checklist, explaining why the family is one issue.",
	"groupSummary": "Optional. Replaces the sampled per-pack summary, which names its own colour."
}
```

`category` is the slugged Vanilla Tweaks category trail — matched against `targetCategory` on missing
packs and `vanillaCategory` on matched ones, so shipped members appear ticked rather than vanishing.

Group only families where every member is the same pack in a different palette: same verdict, same
mechanism. Packs that merely share a *root cause* — the 3D block remodels, the Parity no-ops — still
get one issue each, because each names different work. Grouping is deliberate config, never inferred:
a "these look similar" heuristic misfires exactly where it costs most.

A group closes only when every member has shipped. Feasibility coverage is counted in packs, not
issues, so grouping never inflates it.

**Add a group before `--apply`, not after.** Once per-colour issues exist, grouping means closing and
reopening them; `groupConflicts` reports any member that already has its own issue rather than
silently opening a duplicate.

Managed issue bodies carry a block delimited by `<!-- vt-diff:start -->` and `<!-- vt-diff:end -->`
containing a `<!-- vt-diff:id=rp/PackName -->` marker. The marker is what makes reruns idempotent —
text outside the block is never touched.

## Bumping the Vanilla Tweaks version

Edit `vanillaTweaks.version` in `config.json`, then rerun `fetch.mjs`. Live versions can be probed
directly:

```sh
curl -o /dev/null -w '%{http_code}\n' https://vanillatweaks.net/assets/resources/json/26.2/rpcategories.json
```
