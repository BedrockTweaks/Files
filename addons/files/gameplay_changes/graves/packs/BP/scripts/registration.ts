import { registerCatalog } from '@bedrock-core/catalog';
import { registerConfig, type ConfigApp } from '@bedrock-core/config';
import { registerGuides } from '@bedrock-core/guides';
import { core } from '@bedrock-core/server';
import { configDef, type GravesConfigDef } from './config';
import { i18n } from './UI/i18n';

export let config: ConfigApp<GravesConfigDef>;

export const initRegistration = (): void => {
  ({ config } = core.register({
    manifest: {
      creator: 'bt',
      pack: 'gc_graves',
      packName: i18n.key($ => $.meta.name),
      creatorName: i18n.key($ => $.meta.creator),
      version: '1.0.0',
      description: i18n.key($ => $.meta.description),
      icon: 'textures/ui/icon.png',
    },
    catalog: registerCatalog(),
    config: registerConfig(configDef),
    guides: registerGuides(),
  }));
};

export { core };
