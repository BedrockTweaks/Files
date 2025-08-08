# Git Commit and Pull Request Instructions for Bedrock Tweaks

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
Prefer to use bullet points for each change

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