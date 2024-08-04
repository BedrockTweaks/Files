import { world } from '@minecraft/server';
import { GravesSettings, GravesSettingsDynamicProperties } from '../../Models';
import { getProperties, setProperties } from '../../Util/DynamicProperties';

export const initializeSettings = (): void => {
  if (!getProperties<GravesSettings>(GravesSettingsDynamicProperties).initialized) {
    // TODO save keepinventory status to dynamic property
    world.gameRules.keepInventory = true;

    setProperties<GravesSettings>(
      GravesSettingsDynamicProperties,
      {
        initialized: true,
        graveLocating: true,
        xpCollection: true,
        graveRobbing: false,
        despawnTime: 0,
      },
    );
  }
};

export const getSettings = (): GravesSettings => getProperties<GravesSettings>(GravesSettingsDynamicProperties);

export const setSettings = (graveSettings: GravesSettings): void => {
  setProperties<GravesSettings>(GravesSettingsDynamicProperties, graveSettings);
};
