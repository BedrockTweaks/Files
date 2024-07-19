# Contributing Guidelines

**Please note: These guidelines may change at any time. When updates are made, will be notified
through [Discord](https://bedrocktweaks.net/discord). Please ensure you review them before making a contribution.**

Thank you for considering contributing to Bedrock Tweaks! We appreciate your time and effort. Please take a moment to review the following
guidelines before making any contributions.

## Getting Started

To get started with contributing, follow these steps:

1. Fork the repository.
2. Clone the forked repository to your local machine.
3. Create a new branch for your changes.
4. Make your desired changes.

- Before making a pack make sure:
  - There is not an existing [Pull Request](https://github.com/BedrockTweaks/Files/pulls) for the same pack.
  - The pack is a confirmed [Issue](https://github.com/BedrockTweaks/Files/issues)
    or [Discussion](https://github.com/BedrockTweaks/Files/discussions)

5. Test your changes thoroughly.

- For consoles, you can test by joining a world with the pack applied hosted in another device (phone/computer) in the same network.
- At least need to be tested in 1 device.

6. Commit your changes with the following format.
7. Push your changes to your forked repository.
8. Submit a pull request with the following format to the main repository.

## Style Guide

As a base we use the [Bedrock Wiki Style Guide](https://wiki.bedrock.dev/meta/style-guide.html#top) with some extras and modifications.

We discourage the use of deprecated code and carefully review the use of experimental code.

### Files, Folders and Namespaces

| Concept              | Example Identifier            | 
|----------------------|-------------------------------|
| Bedrock Tweaks       | BT                            |
| Vanilla Tweaks       | VT                            |
| Behavior Pack        | BP                            | 
| Resource Pack        | RP                            | 
| Crafting Tweak       | CT                            | 
| Geometry             | dragon.geo.json               | 
| Geometry ID          | geometry.bt_dragon            |
| Animation            | dragon.animation.json         | 
| Animation RP ID      | animation.rp.bt.dragon_fly    |
| Animation BP ID      | animation.bp.bt.dragon_fly    |
| Animation Controller | dragon.ac.json                | 
| AC RP ID             | animation.rp.bt.dragon_flight |
| AC BP ID             | animation.bp.bt.dragon_flight |
| RP Entity            | dragon.entity.json            | 
| BP Entity            | dragon.json                   | 
| ID                   | bt:md.dragon *                |
| Item                 | dragon_tooth.item.json        | 
| Attachable           | dragon_tooth.attachable.json  | 
| Render Controller    | dragon.rc.json                | 
| Loot Table           | dragon.loot.json              | 
| Recipe               | dragon_saddle.recipe.json     | 
| Spawn Rules          | dragon.spawn.json             | 
| Trade Table          | dragon.trade.json             | 
| Particles            | dragon_magic.particle.json    | 
| Texture              | dragon.png                    |

\* md refers to the pack name initials, in this example "**M**agical **D**ragons", another example would be `bt:mb.ancient_debris` Bedrock
Tweaks Mini Blocks Ancient Debris.

Crafting Tweaks should be in a directory with the packs name inside the recipes directory to avoid conflicts. You can look at existing packs
for reference.

Vanilla files should not be renamed.

### JSON UI

JSON UI must follow [Bedrock Wiki JSON UI Best Practices](https://wiki.bedrock.dev/json-ui/best-practices.html).

### Pack Priority

Packs in the packs.json are ordered by priority, the higher the pack the higher the priority.

`alternate_block_destruction >>> black_nether_bricks >>> lush_grass_all_round`

The pack generator will add the packs to the generated file by priority order. If a file already exists, the generator will skip it to not
add the same file again.

### pack_icon.png

You can find in /templates a template with just the border to override on top of the vanilla tweaks icon, and a full template for new packs
or other cases.

If there is need to scale the template use closest neighbor instead of other sampling methods to avoid blurring.

### Formatting

JSON files should be formatted using 1 tab with size 4 for indentation.
TS files should be formatted using 2 spaces for indentation.

#

If you notice any files not following the Style Guide feel free to open a PR.

Note: not accepting Addons PR at the moment.

## Git Formats

#### Branch Name

```
<type>/<title>
```

### Commit

```
<type>(<scope>): <title>
// blank line
<description_commit>
// blank line
```

### Pull Request

#### Title

```
<type>(<scope>): <title>
```

#### Description

```
<description_pr>

By checking the following boxes with an X, you ensure that:

[ ] The pack was tested ingame in at least one device.
[ ] The pack is an existing BT pack, is a missing pack from VT or is an accepted pack/change in a discussion.
[ ] The pack code follows the style guide.
[ ] The commits follow the contribution guidelines.
[ ] The PR follows the contribution guidelines.

[ ] (Optional) Tested in Windows
[ ] (Optional) Tested in Android
[ ] (Optional) Tested in iOS
[ ] (Optional) Tested in any console
[ ] (Optional) Tested in BDS
```

##### Type

Must be one of the following:

- feat: A new feature
  - Only new/missing vanilla tweaks packs or packs accepted in [discussions](https://github.com/BedrockTweaks/Files/discussions) PR's will
    be accepted.
- update: An update to an existing feature
- fix: A bug fix
  - Only PR's from a confirmed [issue](https://github.com/BedrockTweaks/Files/issues) will be accepted.
- chore: Changes to the build process, tools, documentation...

##### Scope

The scope will always be (files). It indicates this is a commit to
the [Bedrock Tweaks Files](https://github.com/Bedrock-Tweaks/Bedrock-Tweaks-Files) repository.

##### Title

A brief description of the changes. Usually the pack or category name.
Branch Name title and PR title should be the same.

##### Description Commit

A detailed description of the changes. Usually the pack description.

##### Description PR

Contains all the commits descriptions of the PR, the issue or discussion link (if exists), and the checklist.

### Examples

```
feat/bedrock_edition_title
```

```
feat(files): Bedrock Edition Title

Add a Bedrock Edition Logo to the Minecraft Title.
```

```
update/alternate_bedrock
```

```
update(files): Alternate Bedrock

Updated pack to 1.21.0
```

```
update/terrain
```

```
update(files): Terrain

Updated all terrain packs to 1.21.0
```

```
fix/clearer_water
```

```
fix(files): Clearer water

Fixed pack making end sky bright
```

```
chore/documentation_update
```

```
chore(files): documentation update

added README.md
added CONTRIBUTING.md
updated pull_request_template.md
```

Pull requests preferably should contain only one pack, if you have multiple packs to submit, please create a separate pull request for each
pack.

## packs.json

These are the TS interfaces for the packs.json file.

```ts
export interface PacksJSON {
  section: Section;
  // Global pack version, this will be the header.min_engine_version in the manifest.json
  // example: [1, 21, 0]
  version: number[];
  categories: Category[];
  combinations: Combination[];
  deepMergeFiles: DeepMergeFile[];
}

export enum Section {
  ResourcePacks = 'resource_packs',
  Addons = 'addons',
  CraftingTweaks = 'crafting_tweaks'
}

export interface Category {
  id: string;
  name: string;
  packs: Pack[];
  message?: Message;
}

export interface Message {
  text: string;
  severity: Severity;
}

export type Severity = 'success' | 'info' | 'warn' | 'error' | 'secondary';

export interface Pack {
  id: string;
  name: string;
  description: string;
  message?: Message;
  version?: string; // * only Addons and CT
}

/*
 * Pack Version is a string as follows: "<minecraft_version> - <pack_version>"
 * minecraft_version is the minimum major version of the game the pack is compatible with
 * pack_version is the version of the pack for that minecraft update, each mc update it resets
 * example:
 * (version update)     "1.21 - 1.0.0"
 * (bug fix)            "1.21 - 1.0.1"
 * (pack major revamp)  "1.21 - 2.0.0"
 * (pack improvements)  "1.21 - 2.1.0"
 * (version update)     "1.22 - 1.0.0"
 */

export interface Combination {
  // Path to the combination pack
  id: string;
  // Contains an array of <pack_category>/<pack_id> of the packs which make the combination
  combines: string[];
}

// JSON files which will be deep merged into a single file
export interface DeepMergeFile {
  filename: string;
  filepath: string;
}
```

## Reporting Issues

Before opening a new issue, please check if there is already an existing issue that addresses your problem in
our [Issues](https://github.com/Bedrock-Tweaks/Bedrock-Tweaks-Files/issues) page. If there isn't, feel free to open a new one on our GitHub
repository. Provide as much detail as possible, including steps to reproduce the issue and any relevant error messages.

## Suggestions

Before suggesting a new feature or improvement, please check if there is already an existing discussion that matches your idea in
our [Discussions](https://github.com/Bedrock-Tweaks/Bedrock-Tweaks-Files/issues/discussions) page. If there isn't, feel free to open a new
discussion on our GitHub repository. Describe your suggestion in as much detail as possible to help us understand your idea.

## License

By contributing to Bedrock Tweaks, you agree that your contributions will be licensed under the [License](LICENSE).

## Discord Role

As a token of our appreciation for your contribution, significant contributors will have a @Contributor role in
the [Discord](https://bedrocktweaks.net/discord). This role comes with some additional perks and recognition within the community.

We appreciate your contributions and look forward to your involvement in Bedrock Tweaks!
