/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum XpBottlingSettingsDynamicProperties {
	initialized = 'bt:g.settings_initialized'
}

export interface XpBottlingSettings {
	// Indicates whether the XpBottling system settings have been initialized.
	initialized: boolean;
}
