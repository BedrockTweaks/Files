import { world } from '@minecraft/server';
import { AntiGhastGriefSettings, AntiGhastGriefSettingsDynamicProperties } from '../Models';
import { getProperties, setProperties } from '../Util';

/**
 * Initializes the general addon settings for AntiGhastGrief if they are not already initialized.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	if (!getProperties<AntiGhastGriefSettings>(world, AntiGhastGriefSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			AntiGhastGriefSettingsDynamicProperties,
			{
				initialized: true,
				ghastsDoDamage: false,
			},
		);
	}
};

/**
 * Retrieves the current addon settings from the world properties.
 *
 * @returns {AntiGhastGriefSettings} - The current AntiGhastGrief settings
 */
export const getSettings = (): AntiGhastGriefSettings => getProperties<AntiGhastGriefSettings>(world, AntiGhastGriefSettingsDynamicProperties);

/**
 * Updates the addon settings in the world properties.
 *
 * @param {AntiGhastGriefSettings} antiGhastGriefSettings - The updated settings to be saved.
 */
export const setSettings = (antiGhastGriefSettings: AntiGhastGriefSettings): void => {
	setProperties(world, AntiGhastGriefSettingsDynamicProperties, antiGhastGriefSettings);
};
