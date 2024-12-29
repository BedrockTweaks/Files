import { world } from '@minecraft/server';
import { GravesSettings, GravesSettingsDynamicProperties } from '../Models';
import { GravesListDynamicProperties } from '../Models/DynamicProperties';
import { getProperties, setProperties } from '../Util';

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

export const getSettings = (): GravesSettings => getProperties<GravesSettings>(world, GravesSettingsDynamicProperties);

export const setSettings = (graveSettings: GravesSettings): void => {
	setProperties(world, GravesSettingsDynamicProperties, graveSettings);
};
