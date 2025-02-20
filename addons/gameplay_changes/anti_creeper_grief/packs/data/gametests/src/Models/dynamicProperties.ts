/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum AntiCreeperGriefSettingsDynamicProperties {
	initialized = 'bt:acg.settings.initialized',
	creepersDoDamage = 'bt:acg.settings.creepersDoDamage'
}

export interface AntiCreeperGriefSettings {
	// Indicates whether the AntiCreeperGrief system settings have been initialized.
	initialized: boolean;
	// Indicates whether creeper explosions will damage players or not.
	creepersDoDamage: boolean;
}
