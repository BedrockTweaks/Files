import { registerCatalog } from '@bedrock-core/catalog';
import { registerConfig, type ConfigApp } from '@bedrock-core/config';
import { registerGuides } from '@bedrock-core/guides';
import { core, registerModule } from '@bedrock-core/server';
import manifest from '../manifest.json';
import { API } from './api';
import { configDef, type GravesConfigDef } from './config';

export let config: ConfigApp<GravesConfigDef>;

export const initRegistration = (): void => {
  ({ config } = core.register({
    manifest,
    catalog: registerCatalog(),
    config: registerConfig(configDef),
    guides: registerGuides(),
    placement: registerModule(API),
  }));
};

export { core };
