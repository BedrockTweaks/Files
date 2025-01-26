import {
	world,
	Player
} from '@minecraft/server';
import {
	XpBottlingSettings,
	XpBottlingSettingsDynamicProperties,
	PlayerXpBottlingSettings,
	PlayerXpBottlingDynamicProperties
} from '../Models';
import {
	getProperties,
	setProperties
} from '../Util';

/**
 * * Initializes the general addon settings for XpBottling if they are not already initialized.
 * * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	// TODO: overhaul to use a version stub vs generic "initialized" value for updating
	if (!getProperties<XpBottlingSettings>(world, XpBottlingSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			XpBottlingSettingsDynamicProperties,
			{
				initialized: true,
				amountOfXp: 23,
				timeToUse: 0.2,
				enableStackConsume: true,
				enableStackCrafting: true,
			},
		);
	}
};

export const initializePlayerSettings = (player: Player): void => {
	// TODO: overhaul to use a version stub vs generic "initialized" value for updating
	if (getProperties<PlayerXpBottlingSettings>(player, PlayerXpBottlingDynamicProperties).initialized) {
		setProperties(
			player,
			PlayerXpBottlingDynamicProperties,
			{
				initialized: true,
				enableToolTips: true,
				consumeFullStack: false,
				fillFullStack: false,
			},
		);
	}
};

/**
 * * Retrieves the current addon settings from the world properties.
 *
 * @returns {XpBottlingSettings} - The current XpBottling settings
 */
export const getSettings = (): XpBottlingSettings => getProperties<XpBottlingSettings>(world, XpBottlingSettingsDynamicProperties);

/**
 * * Updates the addon settings in the world properties.
 *
 * @param {XpBottlingSettings} xpBottlingSettings - The updated settings to be saved.
 */
export const setSettings = (xpBottlingSettings: XpBottlingSettings): void => {
	setProperties(world, XpBottlingSettingsDynamicProperties, xpBottlingSettings);
};

/**
 * * Retrieves the current addon settings from the player properties.
 *
 * @param {Player} player - The player whose settings should be fetched.
 * @returns {PlayerXpBottlingSettings} - The player's current XpBottling settings
 */
export const getPlayerSettings = (player: Player): PlayerXpBottlingSettings => getProperties<PlayerXpBottlingSettings>(player, PlayerXpBottlingDynamicProperties);

/**
 * * Updates the addon settings in the player properties.
 *
 * @param {Player} player - The player whose settings are to be saved
 * @param {PlayerXpBottlingSettings} playerXpBottlingSettings - The player's updated settings to be saved.
 */
export const setPlayerSettings = (player: Player, playerXpBottlingSettings: PlayerXpBottlingSettings): void => {
	setProperties(player, XpBottlingSettingsDynamicProperties, playerXpBottlingSettings);
};
