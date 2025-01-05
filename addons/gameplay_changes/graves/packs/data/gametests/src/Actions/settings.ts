import { world } from '@minecraft/server';
import { GravesSettings, GravesSettingsDynamicProperties } from '../Models';
import { GravesListDynamicProperties } from '../Models/DynamicProperties';
import { getProperties, setProperties } from '../Util';

/**
 * Initializes the general addon settings for graves if they are not already initialized.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	if (!getProperties<GravesSettings>(world, GravesSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			GravesSettingsDynamicProperties,
			{
				initialized: true,
				graveLocating: true,
				xpCollection: true,
				graveRobbing: false,
				despawnTime: 0,
				keepInventory: world.gameRules.keepInventory,
			},
		);

		// Technically not a setting, but needed to be initialized
		setProperties(world, GravesListDynamicProperties, { list: JSON.stringify([]) });

		world.gameRules.keepInventory = true;
	}
};

/**
 * Retrieves the current addon settings from the world properties.
 *
 * @returns {GravesSettings} - The current graves settings
 */
export const getSettings = (): GravesSettings => getProperties<GravesSettings>(world, GravesSettingsDynamicProperties);

/**
 * Updates the addon settings in the world properties.
 *
 * @param {GravesSettings} graveSettings - The updated settings to be saved.
 */
export const setSettings = (graveSettings: GravesSettings): void => {
	setProperties(world, GravesSettingsDynamicProperties, graveSettings);
};
