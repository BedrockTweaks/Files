import { world } from '@minecraft/server';
import { XpBottlingSettings, XpBottlingSettingsDynamicProperties } from '../Models';
import { getProperties, setProperties } from '../Util';

/**
 * * Initializes the general addon settings for XpBottling if they are not already initialized.
 * * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	if (!getProperties<XpBottlingSettings>(world, XpBottlingSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			XpBottlingSettingsDynamicProperties,
			{
				initialized: true,
				amountOfXp: 23,
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
