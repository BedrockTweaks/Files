import { world } from '@minecraft/server';
import { AntiCreeperGriefSettings, AntiCreeperGriefSettingsDynamicProperties } from '../Models';
import { getProperties, setProperties } from '../Util';

/**
 * Initializes the general addon settings for AntiCreeperGrief if they are not already initialized.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	if (!getProperties<AntiCreeperGriefSettings>(world, AntiCreeperGriefSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			AntiCreeperGriefSettingsDynamicProperties,
			{
				initialized: true,
				creepers_do_damage: false
			},
		);
	}
};

/**
 * Retrieves the current addon settings from the world properties.
 *
 * @returns {AntiCreeperGriefSettings} - The current AntiCreeperGrief settings
 */
export const getSettings = (): AntiCreeperGriefSettings => getProperties<AntiCreeperGriefSettings>(world, AntiCreeperGriefSettingsDynamicProperties);

/**
 * Updates the addon settings in the world properties.
 *
 * @param {AntiCreeperGriefSettings} AntiCreeperGriefSettings - The updated settings to be saved.
 */
export const setSettings = (AntiCreeperGriefSettings: AntiCreeperGriefSettings): void => {
	setProperties(world, AntiCreeperGriefSettingsDynamicProperties, AntiCreeperGriefSettings);
};
