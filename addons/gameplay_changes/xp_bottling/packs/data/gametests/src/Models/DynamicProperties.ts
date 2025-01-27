/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum XpBottlingSettingsDynamicProperties {
	initialized = 'bt:xb.settings_initialized',
	amountOfXp = 'bt:xb.amountOfXp',
	timeToUse = 'bt:xb.timeToUse',
	enableStackConsume = 'bt:xb.enableStackConsume',
	enableStackCrafting = 'bt:xb.enableStackCrafting'
}

export interface XpBottlingSettings {
	// Indicates whether the XpBottling system settings have been initialized.
	initialized: boolean;
	// The amount of XP to store per bottle.
	amountOfXp: number;
	// Controls whether XP bottles are consumed instantly.
	instantUse: boolean;
	// The amount of time taken to drink a bottle
	timeToUse: number;
	// Controls whether Shift + Right Click consumes a full stack of XP bottles.
	enableStackConsume: boolean;
	// Controls whether Shift + Right Click fills an entire stack of empty Glass Bottles.
	enableStackCrafting: boolean;
}

export enum PlayerXpBottlingDynamicProperties {
	initialised = 'bt:xb.player_initialised',
	enableToolTips = 'bt:xb.player_tooltips',
	consumeFullStack = 'bt:xb.consumeFullStack',
	fillFullStack = 'bt:xb.fillFullStack'
}

// TODO: add setting per player to enable stack store and stack drink
export interface PlayerXpBottlingSettings {
	// Indicates whether the player has been initialised in the XpBottling system.
	initialized: boolean;
	// Controls whether actionbar tool tips are displayed.
	enableToolTips: boolean;
	// Controls whether Shift + Right Click a stack of XP Bottles drinks all of them.
	consumeFullStack: boolean;
	// Controls whether Shift + Right Click a stack of empty Glass Bottles fills all that it can.
	fillFullStack: boolean;
}
