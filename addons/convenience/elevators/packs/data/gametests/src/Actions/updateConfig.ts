import { LatestSettingsConfigVersion, LatestBlocksSettingsConfigVersion, ElevatorsSettings, ElevatorsBlocksSettings } from '../Models';
import { initializeSettings, getSettings, setSettings } from './settings';
import { initializeBlocksSettings, getBlocksSettings, setBlocksSettings } from './blocksSettings';

/**
 * @name updateConfig
 * @remarks Updates the config for the addon if an older config version is being used.
 */
export const updateConfig = (): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();
	const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

	if (elevatorsSettings.configVersion !== LatestSettingsConfigVersion) {
		if (elevatorsSettings.configVersion > LatestSettingsConfigVersion) {
			console.error('Config version is higher than latest config version for global settings, resetting global settings to its default values.');

			elevatorsSettings.initialized = false;

			setSettings(elevatorsSettings);
			initializeSettings();

			return;
		}

		while (elevatorsSettings.configVersion < LatestSettingsConfigVersion) {
			switch (elevatorsSettings.configVersion) {
				default:
					console.error('Invalid config version detected for global settings, resetting global settings to its default values.');

					elevatorsSettings.initialized = false;

					setSettings(elevatorsSettings);
					initializeSettings();

					return;
			}
		}

		setSettings(elevatorsSettings);
	}

	if (elevatorsBlocksSettings.configVersion !== LatestBlocksSettingsConfigVersion) {
		if (elevatorsBlocksSettings.configVersion > LatestBlocksSettingsConfigVersion) {
			console.error('Config version is higher than latest config version for blocks settings, resetting blocks settings to its default values.');

			elevatorsBlocksSettings.initialized = false;

			setBlocksSettings(elevatorsBlocksSettings);
			initializeBlocksSettings();

			return;
		}

		while (elevatorsBlocksSettings.configVersion < LatestBlocksSettingsConfigVersion) {
			switch (elevatorsBlocksSettings.configVersion) {
				default:
					console.error('Invalid config version detected for blocks settings, resetting blocks settings to its default values.');

					elevatorsBlocksSettings.initialized = false;

					setBlocksSettings(elevatorsBlocksSettings);
					initializeBlocksSettings();

					return;
			}
		}

		setBlocksSettings(elevatorsBlocksSettings);
	}
};

/**
 * * Example Usage given below:
 *
 * In this case we are using LatestSettingsConfigVersion as 3
 * if (elevatorsSettings.configVersion !== LatestSettingsConfigVersion) {
		if (elevatorsSettings.configVersion > LatestSettingsConfigVersion) {
			console.error("Config version is higher than latest config version for global settings, resetting global settings to its default values.");

			elevatorsSettings.initialized = false;

			setSettings(elevatorsSettings);
			initializeSettings();

			return;
		}

		while (elevatorsSettings.configVersion < LatestSettingsConfigVersion) {
			switch (elevatorsSettings.configVersion) {
				case 1:
					// Upgrading from config version 1 to config version 2
					elevatorsSettings.elevatorsTickParticles = false;

					elevatorsSettings.configVersion = 2;

					break;
				case 2:
					// Upgrading from config version 2 to config version 3

					elevatorsSettings.defaultFacingDirection = "north";

					elevatorsSettings.configVersion = 3;

					break;
				default:
					console.error("Invalid config version detected for global settings, resetting global settings to its default values.");

					elevatorsSettings.initialized = false;

					setSettings(elevatorsSettings);
					initializeSettings();

					return;
			}
		}

		setSettings(elevatorsSettings);
	}
 */
