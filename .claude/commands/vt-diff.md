---
description: Diff Vanilla Tweaks against our packs.json, research Bedrock feasibility, and prepare the tracking issues
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, WebFetch, Agent
---

Run the Vanilla Tweaks parity check.

**Read `tools/vt-diff/AGENTS.md` before doing anything else.** It holds the rules, the source
hierarchy and the verdict rubric. This command is the running order; that file is the method.

Two rules override everything below: never run `issues.mjs --apply`, and never record an alias or a
verdict you have not verified.

## 1. Confirm the pinned Vanilla Tweaks version

Read `vanillaTweaks.version` from `tools/vt-diff/config.json`, then probe the next few candidates —
Vanilla Tweaks uses `YY.N` keys (`26.1`, `26.2`, ...):

```sh
for v in <pinned> <next> ; do curl -s -o /dev/null -w "$v=%{http_code}\n" \
  "https://vanillatweaks.net/assets/resources/json/$v/rpcategories.json"; done
```

If a newer key returns `200`, update `config.json` and say so in your summary. Do not bump silently.

## 2. Fetch and diff

```sh
node tools/vt-diff/fetch.mjs && node tools/vt-diff/diff.mjs
```

## 3. Alias pass

Follow `AGENTS.md` → *Pass A*. Work `missing[].suggestions` **and** cross-reference `bedrockOnly[]`,
since a rename appears on both lists. Verify each candidate against `packs.json` and
`<section>/files/` before writing to `aliases.json`, then rerun `diff.mjs` and confirm both counts
moved.

Report aliases added, candidates rejected and why, and any `packs.json` defects found.

## 4. Feasibility pass

```sh
node tools/vt-diff/feasibility.mjs
```

Follow `AGENTS.md` → *Pass B*. Dispatch one agent per file in `out/feasibility-batches/`, running
them in parallel. Each agent researches only its own batch and returns a JSON fragment. Sources, in
order of preference: the `microsoft-learn` MCP server, `Mojang/bedrock-samples`,
`wiki.bedrock.dev/llms.txt` and its raw Markdown pages.

Merge the fragments into `feasibility.json`, then:

```sh
node tools/vt-diff/feasibility.mjs --validate
```

Fix every reported problem. `unknown` is a valid verdict; a guess is not.

If the developer asked only for an issue refresh and not a research pass, skip this step and say
that the coverage number in the plan will be low.

## 5. Build and review the issue plan

```sh
node tools/vt-diff/issues.mjs
```

Follow `AGENTS.md` → *Pass C*. Verify `reopenCandidates` against `<section>/files/` before reporting
them — do not assume.

## 6. Stop

Present the plan and ask the developer to approve. Only they run `--apply`.

If `gh auth status` fails, tell them to run `gh auth login` — dry runs work without it, `--apply`
does not.

## Reporting rules

Lead with the counts table from `report.md` and the feasibility coverage line from `issue-plan.md`.
Then, in order: newly missing packs since the last run, `reopenCandidates` you verified, `blocked`
verdicts recorded this run, and category drift. Leave `bedrockOnly` out unless asked — those are our
originals, not a gap.
