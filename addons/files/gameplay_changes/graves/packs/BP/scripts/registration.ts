/**
 * `core.register()` lives here (not in main.ts) so every module can import
 * the typed config accessors without a circular dependency on the entry
 * point. main.ts imports this module first.
 */
import { core } from '@bedrock-core/server';
import bundle from '@bedrock-core/generated/i18n';
import guides from '@bedrock-core/generated/guides';
import { configDef } from './config';
import { i18n } from './UI/i18n';

export const config = core.register({
  creator: 'bt',
  pack: 'gc_graves',
  packName: i18n.key($ => $.meta.name),
  creatorName: i18n.key($ => $.meta.creator),
  version: '1.0.0',
  description: i18n.key($ => $.meta.description),
  translations: bundle,
  guide: guides,
  config: configDef,
  icon: 'textures/ui/icon.png',
});

export { core };
