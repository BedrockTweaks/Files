/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum XpBottlingSettingsDynamicProperties {
	initialized = 'bt:xb.settings_initialized',
	amountOfXp = 'bt:xb.amountOfXp'
}

export interface XpBottlingSettings {
	// Indicates whether the XpBottling system settings have been initialized.
	initialized: boolean;
	// TODO: add setting for configuring amount stored per bottle
	amountOfXp: number;
	// TODO: add setting per player to enable stack store and stack drink
}
