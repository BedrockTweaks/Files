/**
 * The player's own graves — one MenuRow per grave, newest first. Replaces the
 * Java pack's paginated tellraw list; the scroll region below the header
 * handles overflow, matching the core `ui(core)` screen shell.
 */
import { Panel, Scroll, Text, usePlayer, useExit, useTranslation, type JSX } from '@bedrock-core/ui';
import { Card, Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import type { ScreenProps } from '@bedrock-core/ui/navigation';
import { i18n } from './i18n';
import { SettingsButton } from './SettingsButton';
import { visibleRecordsOf } from '../index/store';
import { agoStr, dimName, posStr } from '../util';
import type { GravesRoutes } from './GravesApp';

const { spacing } = theme.tokens;

export function GraveList({ navigation }: ScreenProps<GravesRoutes, 'List'>): JSX.Element {
  const player = usePlayer();
  const bound = useTranslation(i18n);
  const exit = useExit();
  const { t, key } = bound;

  const records = [...visibleRecordsOf(player.id)].sort((a, b) => b.diedAt - a.diedAt);

  return (
    <Card flexDirection={'column'} padding={0} gap={0}>
      <Header title={key($ => $.list.title)} onClose={exit} />
      <SettingsButton />
      <Panel flexGrow={1} padding={spacing.sm}>
        <Scroll>
          <Panel flexDirection={'column'} gap={spacing.xs}>
            {records.length === 0
              ? <Text>{t($ => $.list.empty)}</Text>
              : records.map(record => (
                  <MenuRow
                    title={t($ => $.list.row, { count: record.items, xp: record.xp })}
                    subtitle={`${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} — ${agoStr(bound, record.diedAt)}${record.floating ? ` — ${t($ => $.list.floating)}` : ''}`}
                    onPress={() => navigation.navigate('Detail', { graveId: record.id })}
                  />
                ))}
          </Panel>
        </Scroll>
      </Panel>
    </Card>
  );
}
