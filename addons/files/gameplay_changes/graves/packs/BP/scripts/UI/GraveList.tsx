/**
 * The player's own graves — one MenuRow per grave, newest first. Replaces the
 * Java pack's paginated tellraw list; the root scroll handles overflow.
 */
import { Panel, Text, usePlayer, useExit, useTranslation, type JSX } from '@bedrock-core/ui';
import { Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import type { ScreenProps } from '@bedrock-core/ui/navigation';
import { i18n } from './i18n';
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
    <Panel flexDirection={'column'} padding={spacing.md} gap={spacing.md}>
      <Header title={key($ => $.list.title)} onClose={exit} />
      <Panel flexDirection={'column'} gap={spacing.xs}>
        {records.length === 0
          ? <Text>{t($ => $.list.empty)}</Text>
          : records.map(record => (
              <MenuRow
                title={t($ => $.list.row, { count: record.items, xp: record.xp })}
                subtitle={`${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} · ${agoStr(bound, record.diedAt)}${record.floating ? ` · ${t($ => $.list.floating)}` : ''}`}
                onPress={() => navigation.navigate('Detail', { graveId: record.id })}
              />
            ))}
      </Panel>
    </Panel>
  );
}
