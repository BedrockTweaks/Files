import { world } from '@minecraft/server';

export const uninstall = (): void => {
  // TODO recover keepinventory status from dynamic properties
  world.clearDynamicProperties();
};
