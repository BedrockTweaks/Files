/**
 * The addon's one i18n instance — typed verbs over packs/data/i18n.
 *
 * Components bind it with the library hook:
 *
 *   const { t, key, raw, display } = useTranslation(i18n); // from '@bedrock-core/ui'
 *   t($ => $.example.greeting, { name: player.name });     // server-filled string
 *   key($ => $.meta.name);                                 // client-resolved key
 *
 * Outside components (main.ts, chat, logs) bind explicitly with
 * `i18n.forPlayer(player)` / `i18n.forLocale(locale)`.
 *
 * Creating the instance also registers the default translation source, so
 * localized `<Text>` children — `key()` strings and `raw()` messages —
 * measure correctly with no further wiring.
 */
import bundle from '@bedrock-core/generated/i18n';
import { createI18n } from '@bedrock-core/ui/i18n';

export const i18n = createI18n(bundle);
