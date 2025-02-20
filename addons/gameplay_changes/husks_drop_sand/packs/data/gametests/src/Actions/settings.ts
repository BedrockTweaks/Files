import { world } from '@minecraft/server';
import {
	HusksDropSandSettings,
	HusksDropSandSettingsDynamicProperties
} from '../Models';
import {
	getProperties,
	setProperties
} from '../Util';

/**
 * * Initializes the general addon settings for HusksDropSand if they are not already initialized.
 * * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	// TODO: overhaul to use a version stub vs generic "initialized" value for updating
	if (!getProperties<HusksDropSandSettings>(world, HusksDropSandSettingsDynamicProperties).initialized) {
		setProperties(
			world,
			HusksDropSandSettingsDynamicProperties,
			{
				initialized: true,
				version: 1,
				lootingEnabled: true,
				sandMax: 2,
				sandMin: 1,
			},
		);
	}
};

/**
 * * Retrieves the current addon settings from the world properties.
 *
 * @returns {HusksDropSandSettings} - The current HusksDropSand settings
 */
export const getSettings = (): HusksDropSandSettings => getProperties<HusksDropSandSettings>(world, HusksDropSandSettingsDynamicProperties);

/**
 * * Updates the addon settings in the world properties.
 *
 * @param {HusksDropSandSettings} husksDropSandSettings - The updated settings to be saved.
 */
export const setSettings = (husksDropSandSettings: HusksDropSandSettings): void => {
	setProperties(world, HusksDropSandSettingsDynamicProperties, husksDropSandSettings);
};

/**
 * * Updates the addon settings of the properties.
 *
 * @param {object} newSettings - The updated settings to be saved.
 */
export const updateSettings = (newSettings: HusksDropSandSettings): void => {
	const currentSettings: HusksDropSandSettings = getSettings();
	const updatedSettings: HusksDropSandSettings = Object.assign({}, currentSettings, newSettings);
	setSettings(updatedSettings);
};
