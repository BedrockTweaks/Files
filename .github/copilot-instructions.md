# Copilot Instructions for Bedrock Tweaks Files Repository

## Project Overview

This repository contains source code for **Bedrock Tweaks** packs for Minecraft Bedrock Edition, organized into three categories:
- **Resource Packs** (textures, particles, models)
- **Addons** (behavior changes, gameplay mechanics, TypeScript-based scripting via Regolith)
- **Crafting Tweaks** (recipe modifications)

**Key Status**: This is a **Yarn 4 monorepo** for addon management. Resource Packs and Crafting Tweaks are static directory structures. **No Addon PRs currently accepted** (development phase) — only **Resource Packs** and **Crafting Tweaks** accept contributions. See CONTRIBUTING.md.

## Architecture & Directory Structure

```
Files/
├── addons/                         # Yarn 4 monorepo root
│   ├── packs.json                  # Addon catalog with versions
│   └── files/
│       ├── gameplay_changes/       # Category workspace (declares addons)
│       │   ├── package.json
│       │   └── graves/             # Addon package @bedrock-tweaks/graves
│       │       ├── package.json    # version: "1.21.0-1.0.0" (MC_version-pack_version)
│       │       ├── config.json     # Regolith config (TS→JS compilation)
│       │       ├── packs/          # Generated output
│       │       │   ├── BP/         # Behavior pack
│       │       │   └── RP/         # Resource pack
│       │       ├── data/gametests/src/main.ts  # TypeScript entry
│       │       └── filters/        # Regolith filters (node-based)
│       └── templates/addon/        # Starter template for new addons
├── resource_packs/                 # Static structure
│   ├── packs.json
│   ├── files/                      # By category → pack → assets
│   └── extras/
├── crafting_tweaks/                # Static structure
│   ├── packs.json
│   └── files/<category>/<pack>/
├── package.json                    # Root: workspaces=["addons/files/*"]
├── scripts/
│   └── setup-hooks.js              # Husky git hooks
└── .github/copilot-instructions.md # This file
```

## Critical Workflow & Patterns

### Build Pipeline (Yarn Monorepo)
1. **Root entry**: `yarn build` → `yarn workspaces foreach -i -A run build`
2. **Workspace discovery**: Root `package.json` declares `"workspaces": ["addons/files/*"]`, auto-discovering all categories
3. **Category-level workspaces**: Each category (e.g., `addons/files/gameplay_changes/package.json`) declares its addons
4. **Addon builds**: Each runs `regolith run build` → compiles TS→JS in `packs/BP/scripts/`, generates `.mcpack` files

**Key commands:**
- `yarn regolith-install` — Install Regolith + dependencies (run once after `yarn install`)
- `yarn build` — Build all addons
- `yarn lint` — Lint all packages
- `yarn workspace @bedrock-tweaks/graves run build` — Build single addon by scoped name

**Workspace discovery is automatic and name-based**: Yarn finds packages by the `name` field in `package.json`. Root uses glob pattern `addons/files/*` to discover categories, each category declares its addons.

### Addon Development (TypeScript + Regolith)
- **Source**: Only `data/gametests/src/*.ts` is edited; all `.js` files are generated
- **Workflow**: Open addon as **standalone VSCode instance** → run `yarn run dev` for live recompilation (`regolith watch`)
- **Output**: TS→JS compiled to `packs/BP/scripts/main.js`; BP and RP are generated in `packs/`
- **Before PR**: Run `yarn run lint` from addon directory and test in-game
- **Testing**: Manual only (in-game application + gameplay testing)

### Critical Constraints
1. **No public functions in scripts** — Only entry handler (e.g., `main()`) exports; functions callable by operators create security risk
2. **UI over CLI** — All settings in-game or via server forms, not command chains
3. **Prefer functional programming** — Use `const`/`let`, interfaces over types
4. **Shared node_modules** — All addons use root `node_modules`. Delete if addon-level `node_modules` exists
5. **Never edit vanilla files** — Don't rename/modify vanilla Minecraft files (e.g., `cow.entity.json`)

## Naming & Style Conventions

### Identifiers (Bedrock Tweaks Style)
| Concept | Example |
|---------|---------|
| Pack namespace | `bt:` (Bedrock Tweaks), `vt:` (Vanilla Tweaks) |
| Entity ID | `bt:md.dragon` (initials of pack name, e.g., "Magical Dragons") |
| Geometry ID | `geometry.bt_dragon` |
| Animation RP ID | `animation.rp.bt.dragon_fly` |
| Animation BP ID | `animation.bp.bt.dragon_fly` |
| Loot table | `dragon.loot.json` |
| Recipe | `dragon_saddle.recipe.json` |

### Code Formatting
- **Indentation**: 1 tab = 4 spaces (enforced in ESLint, NOT 2 spaces)
- **Icons**: Use **nearest-neighbor** interpolation (not bilinear) to preserve pixelation
- **Quotes**: Single quotes (TypeScript)
- **Semicolons**: Required at end of statements

### TypeScript & ESLint (Addon-specific)
- **Source linting**: Only `data/gametests/src/` (generated `.js` files ignored)
- **ESLint plugins**: `@typescript-eslint`, `@stylistic/eslint-plugin`, `eslint-plugin-minecraft-linting`
- **Naming rules**: camelCase default; UPPER_CASE for constants; PascalCase for enums/types
- **Accessibility**: Private by default (`@typescript-eslint/explicit-member-accessibility`)
- **No `var`**: Use `const`/`let` only
- **Interfaces over types**: Always prefer interfaces

### Crafting Tweaks Isolation
Recipes must be in `crafting_tweaks/files/<pack_category>/<pack_id>/recipes/` to avoid conflicts across packs.

## packs.json Structure & Pack Priority

All packs catalogued in `<section>/packs.json` (resource_packs, addons, crafting_tweaks):

```ts
{
  "section": "resource_packs" | "addons" | "crafting_tweaks",
  "version": [1, 21, 100],        // Global min_engine_version
  "categories": [
    {
      "id": "aesthetic",
      "name": "Aesthetic",
      "packs": [
        {
          "id": "pack_id",
          "name": "Display Name",
          "description": "...",
          "priority": 0,            // Higher = applied first (optional)
          "version": "1.21 - 1.0.0"  // Addons/CT only: "minecraft_version - pack_version"
        }
      ]
    }
  ],
  "deepMergeFiles": [{ "filename": "file.json", "filepath": "path/to/files" }]
}
```

**Priority logic**: Higher priority packs override lower ones in overlay order. Default priority is 0.
**deepMergeFiles**: Recursively merges JSON objects across packs (e.g., combine recipe files from multiple CT packs).

## Git Workflow & Commit Format

**Branch naming**: `<type>/<kebab-case-title>` (e.g., `feat/graves_addon`, `fix/clearer_water`)

**Commit format**:
```
<type>(<scope>): <title>

<detailed description>
```
- **Type**: `feat` (new pack), `update` (existing pack), `fix` (bug), `chore` (build/docs)
- **Scope**: always `(files)` for this repo
- **Example**: `feat(files): Graves Addon\n\nAdd death recovery mechanics with gravestone placement.`

**PR checklist**:
- [ ] Pack tested in at least 1 device (Windows/Android/iOS/console/BDS)
- [ ] Pack is existing BT, missing VT, or accepted in discussion
- [ ] Code follows style guide (4-space tabs, proper naming)
- [ ] Commits follow contribution guidelines
- [ ] For addons only: Run `yarn run lint` from addon directory

**Important**: No Addon PRs currently accepted. Only Resource Packs and Crafting Tweaks.

## Important Patterns & Gotchas

### Critical Project Constraints
1. **No Addon PRs accepted**: Addons are in controlled development. Only Resource Packs and Crafting Tweaks accept contributions.
2. **Git LFS for binaries**: Binary files (.png, .model.json, etc.) tracked via LFS. Must run `git lfs install` first.
3. **Vanilla files untouched**: Never rename vanilla Minecraft files (e.g., `cow.entity.json` stays as-is).
4. **Node 25+ required**: Root `package.json` declares `"engines": {"node": ">=25.0.0"}`. CI will fail on older versions.

### Monorepo & Workspace Patterns
5. **Automatic workspace discovery**: Yarn finds packages by `name` field in `package.json`, not directory structure. Root workspace uses glob `"workspaces": ["addons/files/*"]` to auto-discover all addon categories. Each category workspace declares its addons.
6. **Shared node_modules**: All addons share dependencies installed at root. Individual `node_modules` in addon directories should not exist—delete if present.
7. **Scoped package naming**: Addon packages use `@bedrock-tweaks/<addon-name>` format (e.g., `@bedrock-tweaks/graves`). The `@` prevents npm conflicts and organizes internal packages.
8. **Package version format**: Addons use `"1.21.0-1.0.0"` = Minecraft 1.21.0 minimum engine version, addon version 1.0.0. Each MC update typically resets addon version to 1.0.0 in `addons/packs.json`.

### TypeScript & Code Generation
9. **Edit .ts only, never .js**: All JavaScript files are generated by Regolith from TypeScript. ESLint ignores `**/*.js`. Edit `data/gametests/src/*.ts` only; generated files will update on rebuild.
10. **Regolith compilation**: `regolith run build` compiles TypeScript → JavaScript in `packs/BP/scripts/`. Watch mode (`regolith watch`) auto-recompiles during development.
11. **No public functions in scripts**: Public functions can be called by any operator in-game, creating security risks. Use command handlers or UI buttons (private functions). Example: handler is `main()` which is never exported.
12. **ESLint ignores by design**: `eslint.config.mjs` ignores `.regolith/`, `.vscode/`, `**/*.js` (generated), `filters/`, `build/`, and root-level files. Only lints source TypeScript and JSON files.

### Pack Structure Patterns
13. **Deep merge logic**: `deepMergeFiles` in `packs.json` recursively merges JSON objects (useful for combining item registries across multiple packs). Example: multiple crafting tweaks can merge recipe files without conflicts.
14. **Pack priority logic**: Higher priority packs override lower ones in `packs.json`. Default priority is 0. Use priority to control texture/file precedence (e.g., colorful_slimes priority > sticky_piston_sides priority).
15. **Crafting Tweaks isolation**: CT recipes must be in `crafting_tweaks/files/<pack_category>/<pack_id>/recipes/` to avoid conflicts. Each pack gets its own subdirectory.
16. **Icon scaling**: Always use **nearest-neighbor** interpolation (not bilinear/bicubic) when scaling pack_icon.png to preserve pixelation.

### Development Workflow Gotchas
17. **Husky git hooks**: `yarn install` (with prepare script) sets up pre-push linting via Husky. Commits must pass `yarn lint` to be pushed. This prevents lint failures in CI.
18. **Development setup strategy**: Open individual addon packages as **standalone VSCode instances** for development. The root instance is for monorepo validation and coordination only. This avoids TypeScript conflicts.
19. **Testing is manual only**: No automated Jest/Mocha tests. Testing is in-game only. Open addon as standalone instance, run `yarn run dev`, apply pack in-game, test changes in real-time.
20. **Network device testing**: For console testing, join a network world from another device (phone/computer in same network) with the pack applied on host device.

## Development Commands Reference

**Initial setup (from root):**
```bash
yarn install             # Installs all deps, sets up Husky hooks, Node 25+ required
```

**Root-level commands (from root):**
```bash
yarn build               # Build all addon packages
yarn lint                # Lint all packages
yarn test                # Test all packages (skips if test script missing)
```

**Addon development (from addon directory - recommended to open as standalone VSCode instance):**
```bash
yarn run dev             # Live recompilation (regolith watch)
yarn run build           # Build once
yarn run lint            # Lint addon
```

**Regolith directly (when needed):**
```bash
regolith install-all     # Install Regolith + module dependencies
regolith run build       # Build once
```

**Manual testing (no automated tests):**
- Single device: apply pack in world settings
- Multi-device: join network world from another device (phone/computer)

## Common Addon Patterns

### UI-Driven Settings (Preferred Pattern)
- Use `@minecraft/server-ui` for player interactions (menus, forms)
- Store addon state in scoreboard objectives or player tags (persists across reloads)
- Avoid command chains; open UI from simple `/ui_command` or chat message
- Example: `mainForm.show(player)` → user selects option → handler updates state

### TypeScript Module Structure
- Entry point: `data/gametests/src/main.ts` (compiled to `packs/BP/scripts/main.js`)
- Import from `@minecraft/*` packages (server, server-ui, common, math, vanilla-data)
- Use `world.afterEvents` and `world.beforeEvents` for event-driven logic
- Prefer const arrow functions: `const handleDeath = (event: EntityDieAfterEvent) => { ... }`

### Testing Workflow
- No automated Jest/Mocha tests (manual in-game testing only)
- Open addon as standalone VSCode instance
- Run `yarn run dev` in terminal
- Apply pack in-game and test changes in real-time
- Changes to `.ts` files auto-compile; restart world to reload scripts

## Key Files for Reference

| File | Purpose |
|------|---------|
| `CONTRIBUTING.md` | Detailed contribution rules, style guide, commit format, addon setup |
| `README.md` | Project overview and monorepo structure |
| `resource_packs/packs.json` | Master catalog of all resource packs + priority/messaging |
| `crafting_tweaks/packs.json` | Master catalog of recipes |
| `addons/packs.json` | Master catalog of addons with versions |
| `addons/files/gameplay_changes/package.json` | Category workspace (declares addon packages) |
| `addons/files/gameplay_changes/graves/package.json` | Example addon package config |
| `addons/files/gameplay_changes/graves/config.json` | Regolith build config (TypeScript compilation) |
| `package.json` (root) | Yarn 4 monorepo config + workspace scripts |
| `scripts/setup-hooks.js` | Husky git hooks setup (only remaining script) |
| `templates/addon/` | Starter template for new addons |

## When to Verify with Humans

**Always ask humans before implementing:**
- **Addon PRs**: Any addon creation/modification (addons not accepting PRs currently)
- **Architecture changes**: Changes to build system, workspace structure, packs.json format, or directory layout
- **Monorepo scripts**: Changes to root `package.json` scripts or workspace declarations
- **Regolith config**: Changes to `config.json` profiles or filter definitions
- **Style guide ambiguities**: When naming or formatting doesn't match existing patterns (ask instead of guessing)
- **Cross-pack dependencies**: When a new pack must interact with or depend on another pack (may cause conflicts)
- **Public API functions**: Any function that could be called from in-game (security vulnerability risk)
