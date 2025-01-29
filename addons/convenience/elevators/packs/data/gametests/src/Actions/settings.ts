import { world } from "@minecraft/server";
import { ElevatorsSettings, ElevatorsSettingsDynamicProperties } from "../Models";
import { getProperties, setProperties } from "../Util";

/**
 * @name initializeSettings
 * @remarks Initializes the general addon settings for elevators if they are not already initialized.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeSettings = (): void => {
	const defaultElevatorsSettings: ElevatorsSettings = {
		// TODO: Add config versioning
		initialized: true,
		defaultFacingDirection: "none",
		elevatorsTickParticles: true,
		safeTeleport: false,
		camouflage: true,
		xpLevelsUse: 0,
	};

	const elevatorsSettings: ElevatorsSettings = getSettings();

	if (!elevatorsSettings.initialized) {
		setSettings(defaultElevatorsSettings);
	} else {
		// TODO: Use config version instead of this
		setSettings(Object.assign({}, defaultElevatorsSettings, elevatorsSettings));
	}
};

/**
 * @name getSettings
 * @remarks Retrieves the current addon settings from the world properties.
 * @returns {ElevatorsSettings} The current elevators settings.
 */
export const getSettings = (): ElevatorsSettings => getProperties<ElevatorsSettings>(world, ElevatorsSettingsDynamicProperties);

/**
 * @name setSettings
 * @param {ElevatorsSettings} elevatorsSettings - The updated settings to be saved.
 * @remarks Updates the addon settings in the world properties.
 */
export const setSettings = (elevatorsSettings: ElevatorsSettings): void => {
	setProperties(world, ElevatorsSettingsDynamicProperties, elevatorsSettings);
};
