/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum XpBottlingSettingsDynamicProperties {
	initialized = 'bt:xb.settings_initialized',
	version = 'bt:xb.version',
	amountOfXp = 'bt:xb.amountOfXp',
	instantUse = 'bt:xb.instantUse',
	timeToUse = 'bt:xb.timeToUse',
	stackMultiplier = 'bt:xb.stackMultiplier',
	enableStackConsume = 'bt:xb.enableStackConsume',
	enableStackCrafting = 'bt:xb.enableStackCrafting'
}

export interface XpBottlingSettings {
	// Indicates whether the XpBottling system settings have been initialized.
	initialized: boolean;
	// Indicated the current loaded version of the addon.
	version: number;
	// The amount of XP to store per bottle.
	amountOfXp: number;
	// Controls whether XP bottles are consumed instantly.
	instantUse: boolean;
	// The amount of time taken to drink a bottle.
	timeToUse: number;
	// When consuming a stack of bottles, the amount to multiply it by.
	stackMultiplier: number;
	// Controls whether Shift + Right Click consumes a full stack of XP bottles.
	enableStackConsume: boolean;
	// Controls whether Shift + Right Click fills an entire stack of empty Glass Bottles.
	enableStackCrafting: boolean;
}

export enum PlayerXpBottlingSettingsDynamicProperties {
	initialized = 'bt:xb.player_initialized',
	receivedBook = 'bt:xb.playerRecievedBook',
	enableToolTips = 'bt:xb.playerToolTips',
	consumeFullStack = 'bt:xb.consumeFullStack',
	fillFullStack = 'bt:xb.fillFullStack',
	usingSince = 'bt:xb.using'
}

export interface PlayerXpBottlingSettings {
	// Indicates whether the player has been initialized in the XpBottling system.
	initialized: boolean;
	// Indicated whether the player has recieved the guide book to let them configure settings.
	receivedBook: boolean;
	// Controls whether actionbar tool tips are displayed.
	enableToolTips: boolean;
	// Controls whether Shift + Right Click a stack of XP Bottles drinks all of them.
	consumeFullStack: boolean;
	// Controls whether Shift + Right Click a stack of empty Glass Bottles fills all that it can.
	fillFullStack: boolean;
	// [Internal] Used to check if item has been used for global timeToUse setting.
	usingSince: number;
}
