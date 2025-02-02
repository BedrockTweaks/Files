import { world,	Player } from '@minecraft/server';
import {
	XpBottlingSettings,
	XpBottlingSettingsDynamicProperties,
	PlayerXpBottlingSettings,
	PlayerXpBottlingSettingsDynamicProperties
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
				version: 1,
				amountOfXp: 22,
				instantUse: false,
				timeToUse: 16,
				enableStackConsume: false,
				stackMultiplier: 4,
				enableStackCrafting: false,
			},
		);
	}
};

export const initializePlayerSettings = (player: Player): void => {
	// TODO: overhaul to use a version stub vs generic "initialized" value for updating
	if (!getProperties<PlayerXpBottlingSettings>(player, PlayerXpBottlingSettingsDynamicProperties).initialized) {
		setProperties(
			player,
			PlayerXpBottlingSettingsDynamicProperties,
			{
				initialized: true,
				receivedBook: false,
				enableToolTips: true,
				consumeFullStack: true,
				fillFullStack: true,
				usingSince: 0,
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
 * * Updates the addon settings of the properties.
 *
 * @param {object} newSettings - The updated settings to be saved.
 */
export const updateSettings = (newSettings: XpBottlingSettings): void => {
	const currentSettings: XpBottlingSettings = getSettings();
	const updatedSettings: XpBottlingSettings = Object.assign({}, currentSettings, newSettings);
	setSettings(updatedSettings);
};

/**
 * * Retrieves the player's current settings.
 *
 * @param {Player} player - The player whose settings should be fetched.
 * @returns {PlayerXpBottlingSettings} - The player's current XpBottling settings
 */
export const getPlayerSettings = (player: Player): PlayerXpBottlingSettings => getProperties<PlayerXpBottlingSettings>(player, PlayerXpBottlingSettingsDynamicProperties);

/**
 * * Sets the player's settings.
 *
 * @param {Player} player - The player whose settings are to be saved.
 * @param {PlayerXpBottlingSettings} playerXpBottlingSettings - The player's new settings to be set.
 */
export const setPlayerSettings = (player: Player, playerXpBottlingSettings: PlayerXpBottlingSettings): void => {
	setProperties(player, PlayerXpBottlingSettingsDynamicProperties, playerXpBottlingSettings);
};

/**
 * * Updates the player's settings.
 *
 * @param {Player} player - The player whose settings are to be updated.
 * @param {object} newSettings - The player's updated settings to be saved.
 */
export const updatePlayerSettings = (player: Player, newSettings: object): void => {
	const currentSettings: PlayerXpBottlingSettings = getPlayerSettings(player);
	const updatedSettings: PlayerXpBottlingSettings = Object.assign({}, currentSettings, newSettings);
	setPlayerSettings(player, updatedSettings);
};
