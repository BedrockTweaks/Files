# Git Commit and Pull Request Instructions for Bedrock Tweaks

## Git Formats

### Branch Name

```md
<type>/<title>
```

### Commit

```md
<type>(<scope>): <title>
// blank line
<description_commit>
// blank line
```

### Pull Request

#### PR Title

```md
<type>(<scope>): <title>
```

#### Description

```md
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

##### Type tag

Must be one of the following:

- feat: A new feature
  - Only new/missing vanilla tweaks packs or packs accepted in [discussions](https://github.com/BedrockTweaks/Files/discussions) PR's will
    be accepted.
- update: An update to an existing feature
- fix: A bug fix
  - Only PR's from a confirmed [issue](https://github.com/BedrockTweaks/Files/issues) will be accepted.
- chore: Changes to the build process, tools, documentation...

##### Scope tag

The scope will always be (files). It indicates this is a commit to
the [Bedrock Tweaks Files](https://github.com/Bedrock-Tweaks/Bedrock-Tweaks-Files) repository.

##### Title tag

A brief description of the changes. Usually the pack or category name.
Branch Name title and PR title should be the same.

##### Description Commit tag

A detailed description of the changes. Usually the pack description.
Prefer to use bullet points for each change

##### Description PR tag

Contains all the commits descriptions of the PR, the issue or discussion link (if exists), and the checklist.

### Examples

```md
feat/bedrock_edition_title
```

```md
feat(files): Bedrock Edition Title

Add a Bedrock Edition Logo to the Minecraft Title.
```

```md
update/alternate_bedrock
```

```md
update(files): Alternate Bedrock

Updated pack to 1.21.0
```

```md
update/terrain
```

```md
update(files): Terrain

Updated all terrain packs to 1.21.0
```

```md
fix/clearer_water
```

```md
fix(files): Clearer water

Fixed pack making end sky bright
```

```md
chore/documentation_update
```

```md
chore(files): documentation update

added README.md
added CONTRIBUTING.md
updated pull_request_template.md
```
