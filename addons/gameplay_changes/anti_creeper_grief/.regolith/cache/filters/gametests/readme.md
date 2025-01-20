# Gametests

This filter is for injecting into a pack a gametest module and code mainly for actual map testing.

The advantage of using this specific filter is that without running this filter, no gametest content will be in the final pack (for example, dev and QA profile might include gametests and package profile might not).

## Getting the Filter

Install with: `regolith install gametests`. After that, you can place the filter into one of your profiles.

```json
{
  "filter": "gametests",
  // Following settings are set by default
  "settings": {
    "moduleUUID": null,
    "modules": ["mojang-gametest", "mojang-minecraft"],
    "outfile": "BP/scripts/main.js",
    "manifest": "BP/manifest.json",
    "buildOptions": {
      "entryPoints": ["data/gametests/src/main.ts"],
      "target": "es2020",
      "format": "esm",
      "bundle": true,
      "minify": true
    }
  }
}
```

```json
{
  "filter": "gametests",
  // Following settings are set by default
  "settings": {
    "moduleUUID": null,
    "modules": ["mojang-gametest", "mojang-minecraft"],
    "outfile": "BP/scripts/main.js",
    "outdir": "BP/scripts",
    "manifest": "BP/manifest.json",
    "buildOptions": {
      "entryPoints": ["data/gametests/src/**/*.ts"],
      "target": "es2020",
      "format": "esm",
      "bundle": false,
      "minify": false
    }
  }
}
```

## Documentation

This filter will:

- build the project into a single JS file using esbuild
- copy compiled code to behavior pack
- copy all files from `extra_files` folder into behavior pack (useful for test structures)
- inject gametest module and required dependencies into behavior pack manifest

The filter also has included support for importing JSON files using JSON5 parser.

## Settings

| Setting                       | Type                                                     | Default                                                 | Description                                                                                                                                         |
|-------------------------------|----------------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `buildOptions`                | [buildOptions](https://esbuild.github.io/api/#build-api) | [Default Build Options](#default-build-options)         | Specifies build options for esbuild                                                                                                                 |
| `moduleUUID`                  | string                                                   | Random UUID generated the first time the filter is ran. | The UUID to place inside the manifest module                                                                                                        |
| `modules`                     | string[]                                                 | ["@minecraft/server@1.0.0"]                             | The scripting modules to inject as dependencies, follows the format '``@``'                                                                         |
| `outfile`                     | string                                                   | "BP/scripts/main.js"                                    | The path to place the built script file at when buildOptions.bundle is enabled. This property is also used as the entry point for the script module |
| `outdir`                      | string                                                   | "BP/scripts"                                            | The path to build to when buildOptions.bundle is disabled                                                                                           |
| `moduleType`                  | string                                                   | "script"                                                | The manifest module type to inject                                                                                                                  |
| `manifest`                    | string                                                   | "BP/manifest.json"                                      | The manifest to edit                                                                                                                                |
| `debugBuild`                  | boolean                                                  | false                                                   | Enables source maps and adds launch configuration to `.vscode/launch.json` if it exists                                                             |
| `disableManifestModification` | boolean                                                  | false                                                   | Disables adding dependencies and script module to the manifest.                                                                                     |

#### Default Build Options

```js
{
    entryPoints: ["data/gametests/src/main.ts"],
    target: "es2020",
    format: "esm",
    bundle: true,
    minify: true
}
```

## Modifying config with a JS file

You can modify the settings of this filter by creating a file named `*.esbuild.config.js` in `data/gametests` folder. The file should export a function `config` that takes in the current settings. Other filters ran before this filter can place their config files in data/gametests folder and they will be loaded. The config files are loaded in alphabetical order, so if you want to override a setting, make sure your config file is loaded after the other filter's config file.

```js
// Example config file
module.exports = {
  config: (settings) => {
    // Modify settings here
    settings.buildOptions.entryPoints = ["data/gametests/extra_src/**/*.ts"];
  },
};
```

## Changelog
### 1.6.1
 - Renamed `debug_build` to `debugBuild` in the schema to match the other settings' name.
 - Added `disableManifestModification` setting, that disables adding dependencies and script module to the manifest. The default value is `false`.
### 1.6.0
 - Added `debug_build` setting, that helps with connecting the debugger to the Minecraft client. When enabled, the build will include source maps and will add a correct launch configuration to `.vscode/launch.json` if it exists. The default value is `false`.
 - Fixed generating the module UUID, when `moduleUUID` is not set in the settings.

### 1.5.3
Fixed the issue that caused the filter to fail when used in Regolith that uses the `use_project_app_data_storage` option (issue #53).

### 1.5.2

- Updated the default tsconfig to include `resolveJsonModule` set to `true`.

### 1.5.1

- Updated the example script to use the new `@minecraft/server` and `@minecraft/server-gametest` versions

### 1.5.0

- Added a way to modify settings with a JS file. The file should be named `*.esbuild.config.js` and export a function `config` that takes in the current settings. Other filters ran before this filter can place their config files in data/gametests folder and they will be loaded. The config files are loaded in alphabetical order, so if you want to override a setting, make sure your config file is loaded after the other filter's config file.
- Added a setup script, that will try to install dependencies of the script API module.

### 1.4.2

- Updated esbuild to 0.19.8

### 1.4.1

- Added missing `outdir` and `outfile` defaults

### 1.4.0

- Swapped from a hardcoded list of supported module versions to a pattern match
- Made specifying module versions in settings required
- Added glob support to `buildOptions.entryPoints`
- Added support for `outdir`, used when `buildOptions.bundle` is disabled

### 1.3.3

- Added new `@minecraft/server` and `@minecraft/server-ui` versions
- Fixed modules not being added to `buildOptions.external` if it was already specified in the filter settings

### 1.3.2

- Added new `@minecraft/server` versions

### 1.3.1

- Fixed full module string being added to the `buildOptions.external` property instead of just the module name

### 1.3.0

- `settings.modules` now takes an array of strings in the format of `<module_name>@<version>` or `<module_name>`, this change allows you to use a specific version of a script module
- A warning is now printed when using an unknown module rather than throwing an error.
- An error is thrown if you do not specify a version with an unknown module
- Updated to use new dependency format `{module_name: string, version: string}`
- Updated example script to use 1.19.60 beta script modules
- Updated the schema to include some enums for module suggestions in VSCode
- Added handling for attempting to add modules when manifest modules already exist

### 1.2.0

Update versioning introduced in 1.19.30.20 beta

### 1.1.0

- Removed the modules from data as it was causing long run times, likely due to needing to move all those files when regolith runs. The only modules kept were the mojang- typings. This change should decrease the amount of time regolith takes to run when using this filter.
- Removed eslint and such since the modules were removed, kept `.prettierrc.json` as the vscode extension works with it
- Moved building script to filter folder instead of data folder since the esbuild and json5 node_modules are no longer stored in data
- Added a check to moving extra_files as it would cause an error before if a user decided to remove the folder

Following changes are in preparation for client scripts, if they ever come out

- Added manifest setting to allow the user to specify the manifest path
- extra_files now needs a folder to specify whether to output to BP or RP, so what was previously `extra_files/test/jsonFile.json` would now need to be `extra_files/BP/test/jsonFile.json`

These changes also fix the infinite loop issue cause by the post-install script in #36 (the script no longer exists as the node modules are no longer installed in the data folder by default)

### 1.0.3

- Added `settings.moduleType` option to specify the type of module (`javascript` before 1.19 and `script` after 1.19, `javascript` by default)

### 1.0.2

- Fixed `settings.buildOptions.outfile` referencing the invalid setting `settings.out`, now references `settings.outfile` instead [#35](https://github.com/Bedrock-OSS/regolith-filters/pull/35)
- `settings.buildOptions` should now properly merge with defaults rather than entirely replacing them [#35](https://github.com/Bedrock-OSS/regolith-filters/pull/35)

### 1.0.1

- Added `outfile` setting, used to determine where the resulting build file will be located [#33](https://github.com/Bedrock-OSS/regolith-filters/pull/33)
- Added `modules` setting to choose which gametest modules to inject into the manifest dependencies, as well as which to allow during building [#33](https://github.com/Bedrock-OSS/regolith-filters/pull/33)
- customizing `buildOptions` will now overwrite each individual property, rather than overwriting `buildOptions` as a whole. This allows for use cases where a user may not want to entirely overwrite the `buildOptions` [#33](https://github.com/Bedrock-OSS/regolith-filters/pull/33)

### 1.0.0

The first release of Gametests filter.
