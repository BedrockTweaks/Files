/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum AntiGhastGriefSettingsDynamicProperties {
	initialized = 'bt:agg.settings.initialized',
	ghastsDoDamage = 'bt:agg.settings.ghastsDoDamage'
}

export interface AntiGhastGriefSettings {
	// Indicates whether the AntiGhastGrief system settings have been initialized.
	initialized: boolean;
	// Indicates whether Ghast explosions will damage players or not.
	ghastsDoDamage: boolean;
}
