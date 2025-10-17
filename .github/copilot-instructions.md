# Copilot Instructions for Bedrock Tweaks Files Repository

## Project Overview

This repository houses the source code for **Bedrock Tweaks** packs - a collection of Minecraft Bedrock Edition modifications organized into three categories:
- **Resource Packs** (textures, particles, models)
- **Addons** (behavior changes, gameplay mechanics, scripting)
- **Crafting Tweaks** (recipe modifications)

Each pack is independently versioned and all packing is handled by a server which combines packs in different ways based on user selections.

**Monorepo Structure**: This is a **Yarn 4 monorepo** where addons are managed as workspace packages. The root `package.json` coordinates the entire monorepo, while individual addon packages manage their own builds and dependencies.

## Architecture & Directory Structure

```
Files/
├── resource_packs/                # Static: Texture/visual modifications (NOT a package)
│   ├── packs.json                 # RP catalog
│   ├── files/                     # Category → pack → assets
│   └── extras/                    # Special handling packs
├── crafting_tweaks/               # Static: Recipe modifications (NOT a package)
│   ├── packs.json                 # CT catalog
│   └── files/<category>/<pack>/   # Recipes organized by category
├── addons/                        # Yarn workspace root (MONOREPO)
│   ├── package.json               # Root workspace: workspaces: ["*"]
│   ├── packs.json                 # Addon catalog
│   ├── gameplay_changes/          # Category workspace
│   │   ├── package.json           # Category workspace: workspaces: ["graves", ...]
│   │   └── graves/                # Individual addon package
│   │       ├── package.json       # Addon package: @bedrock-tweaks/graves
│   │       ├── config.json        # Regolith build config
│   │       ├── packs/BP/          # Behavior pack (generated)
│   │       ├── packs/RP/          # Resource pack (generated)
│   │       └── data/gametests/src/main.ts  # TypeScript source
│   └── templates/addon/           # Starter template
├── scripts/
│   └── setup-hooks.js             # Husky git hooks setup
└── lfs-hooks/                     # Git LFS lifecycle hooks
```

## Critical Workflow

### Build Process (Yarn Workspaces)
1. **Root**: `yarn build` → runs `yarn workspaces foreach -i run build`
2. **Per-workspace**: Yarn discovers all packages in `addons/*`
3. **Each addon**: Executes its `package.json` build script: `regolith run build`
4. **Output**: Generates `.mcpack` files in each addon's `build/` directory
5. **Shared dependencies**: All addons share a single `node_modules` at root (optimized for size/speed)

**Related commands:**
- `yarn lint` - Lints all packages (runs `npm run lint` in each)
- `yarn test` - Tests all packages (continues if test script missing, treats as pass)
- `yarn workspace @bedrock-tweaks/graves run build` - Build single addon

**Key insight**: Yarn workspace discovery is **automatic and name-based**. Packages are identified by the `name` field in `package.json`, not by directory structure.

### Addon Development (Regolith + TypeScript)
- Addons use **Regolith** (https://bedrock-oss.github.io/regolith/) to compile TypeScript → JavaScript
- Behavior/Resource Pack packs live in `packs/BP/` and `packs/RP/`
- Scripting source in `data/gametests/src/main.ts` is bundled to `BP/scripts/main.js`
- **Recommended workflow**: Open each addon as a standalone VSCode instance, then run `yarn run dev` for live recompilation
- **Before PR**: Run `yarn run lint` from the addon directory and test in-game

### Addon Constraints (from CONTRIBUTING.md)
- **No public functions** except player-facing UI openers (operator access vulnerability)
- **UI over CLI**: All settings in-game or via server forms; no command chains
- Prefer **functional programming** over OOP; use `const`/`let` over `var`
- Prefer **interfaces over types** (TypeScript style guide)

## Naming & Style Conventions

### Identifiers (from CONTRIBUTING.md Style Guide)
| Concept | Example |
|---------|---------|
| Pack namespace | `bt:` (Bedrock Tweaks), `vt:` (Vanilla Tweaks) |
| Entity ID | `bt:md.dragon` (initials of pack name, e.g., "Magical Dragons") |
| Geometry | `dragon.geo.json` → ID: `geometry.bt_dragon` |
| Animation RP | `dragon.animation.json` → ID: `animation.rp.bt.dragon_fly` |
| Animation BP | → ID: `animation.bp.bt.dragon_fly` |
| Item | `dragon_tooth.item.json` |
| Loot Table | `dragon.loot.json` |
| Recipe | `dragon_saddle.recipe.json` |

**Crafting Tweaks** recipes must be in `crafting_tweaks/files/<pack_category>/<pack_id>/recipes/` to avoid conflicts.

### Formatting
- **JSON/JS/TS**: 1 tab = 4 spaces (not 2 spaces)
- **Icon scaling**: Use **nearest-neighbor** interpolation (preserve pixelation)

## packs.json Structure

All packs are catalogued in section-specific `packs.json` files (resource_packs, crafting_tweaks, addons).

```ts
{
  "section": "resource_packs" | "addons" | "crafting_tweaks",
  "version": [1, 21, 100],  // Global min_engine_version for all packs in this section
  "categories": [
    {
      "id": "aesthetic",
      "name": "Aesthetic",
      "packs": [
        {
          "id": "pack_id",
          "name": "Display Name",
          "description": "...",
          "priority": 0,          // Higher = applied first (optional)
          "disabled": false,      // (optional)
          "version": "1.21 - 1.0.0"  // Addons/CT only: "minecraft_version - pack_version"
        }
      ],
      "message": { "text": "...", "severity": "warn" | "error" | ... }  // (optional)
    }
  ],
  "combinations": [{ "id": "combo_pack", "combines": ["category/pack_id", ...] }],
  "deepMergeFiles": [{ "filename": "file.json", "filepath": "path/to/files" }]
}
```

**Priority logic**: Higher priority packs override lower ones. Use priority to control texture/file precedence.

## Git Workflow & Commit Format

### Branch Naming
```
<type>/<kebab-case-title>
example: feat/graves_addon, fix/clearer_water
```

### Commit Format
```
<type>(<scope>): <title>

<detailed description>
```
- **Type**: `feat` (new pack), `update` (existing pack), `fix` (bug), `chore` (build/docs)
- **Scope**: always `(files)` for this repo
- **Title**: pack name or component
- Example: `feat(files): Graves Addon\n\nAdd death recovery mechanics with gravestone placement.`

### Pull Request Checklist
- Pack tested in **at least 1 device** (Windows/Android/iOS/console/BDS)
- Pack is **existing BT**, missing VT, or **accepted in discussion**
- Code follows style guide (4-space tabs, proper naming)
- Commits follow contribution guidelines
- All boxes checked in PR description template

**Important**: No Addon PRs currently accepted (see CONTRIBUTING.md). Resource Packs and Crafting Tweaks only.

## Important Patterns & Gotchas

1. **Git LFS for binaries**: Binary files (.png, .model.json, etc.) tracked via LFS. Must run `git lfs install`.
2. **Vanilla files untouched**: Never rename vanilla Minecraft files (e.g., `cow.entity.json` stays as-is).
3. **Deep merge logic**: `deepMergeFiles` in packs.json recursively merges JSON objects (useful for combining item registries).
4. **Package naming**: Addon packages use scoped names `@bedrock-tweaks/<addon-name>`. The `@` prevents npm conflicts and organizes internal packages.
5. **Package version format**: `"1.21.0-1.0.0"` = Minecraft 1.21.0 minimum, addon version 1.0.0. Each MC update typically resets addon version to 1.0.0.
6. **Workspace discovery**: Yarn finds packages by `name` field, not directory structure. Ensure each addon has a unique `name` in `package.json`.
7. **Shared node_modules**: All addons share dependencies installed at root. Individual `node_modules` in addon directories should not exist.
8. **Husky git hooks**: `yarn install` (with prepare script) sets up pre-push linting. Commits must pass lint to be pushed.
9. **Development setup**: Open individual addon packages as standalone VSCode instances for development. The root is for monorepo management and validation.

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

## Key Files for Reference

| File | Purpose |
|------|---------|
| `CONTRIBUTING.md` | Detailed contribution rules, style guide, commit format, addon setup |
| `README.md` | Project overview and monorepo structure |
| `resource_packs/packs.json` | Master catalog of all resource packs + priority/messaging |
| `crafting_tweaks/packs.json` | Master catalog of recipes |
| `addons/packs.json` | Master catalog of addons with versions |
| `addons/gameplay_changes/package.json` | Category workspace (declares addon packages) |
| `addons/gameplay_changes/graves/package.json` | Example addon package config |
| `addons/gameplay_changes/graves/config.json` | Regolith build config (TypeScript compilation) |
| `package.json` (root) | Yarn 4 monorepo config + workspace scripts |
| `scripts/setup-hooks.js` | Husky git hooks setup (only remaining script) |
| `templates/addon/` | Starter template for new addons |

## When to Verify with Humans

- **Major architecture changes**: Changes to build system, packs.json structure, or directory layout
- **New addon patterns**: TypeScript scripting approaches not matching existing addons
- **Style guide ambiguities**: When naming or formatting isn't clearly covered
- **Cross-pack dependencies**: When a new pack must interact with or depend on another pack
