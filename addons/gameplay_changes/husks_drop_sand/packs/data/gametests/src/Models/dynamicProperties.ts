/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum HusksDropSandSettingsDynamicProperties {
	initialized = 'bt:hds.settingsInitialized',
	version = 'bt:hds.version',
	lootingEnabled = 'bt:hds.lootingEnabled',
	sandMax = 'bt:hds.sandMax',
	sandMin = 'bt:hds.sandMin'
}

export interface HusksDropSandSettings {
	// Indicates whether the HusksDropSand addon settings have been initialized.
	initialized: boolean;
	// Indicated the current version of the addon config.
	version: number;
	// Controls whether or not looting will increase the number of items dropped.
	lootingEnabled: boolean;
	// Specifies the minimum amount of sand to drop.
	sandMax: number;
	// Specifies the maximum amount of sand to drop.
	sandMin: number;
}
