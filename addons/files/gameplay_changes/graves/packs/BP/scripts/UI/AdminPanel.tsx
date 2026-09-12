/**
 * Every grave in the world, straight from the index — no chunk needs to be
 * loaded (§6b). Rows navigate into the same detail screen the list uses.
 * Same core screen shell as the list: Card parent, scroll below the header.
 */
import { Panel, Scroll, Text, useExit, useTranslation, type JSX } from '@bedrock-core/ui';
import { Card, Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import type { ScreenProps } from '@bedrock-core/ui/navigation';
import { i18n } from './i18n';
import { SettingsButton } from './SettingsButton';
import { allRecords } from '../index/store';
import { agoStr, dimName, posStr } from '../util';
import type { GravesRoutes } from './GravesApp';

const { spacing } = theme.tokens;

export function AdminPanel({ navigation }: ScreenProps<GravesRoutes, 'Admin'>): JSX.Element {
  const bound = useTranslation(i18n);
  const exit = useExit();
  const { t, key } = bound;

  const records = [...allRecords()].sort((a, b) => b.diedAt - a.diedAt);

  return (
    <Card flexDirection={'column'} padding={0} gap={0}>
      <Header title={key($ => $.admin.title)} onClose={exit} />
      <SettingsButton />
      <Panel flexGrow={1} padding={spacing.sm}>
        <Scroll>
          <Panel flexDirection={'column'} gap={spacing.xs}>
            {records.length === 0
              ? <Text>{t($ => $.admin.empty)}</Text>
              : records.map(record => (
                  <MenuRow
                    title={record.ownerName}
                    subtitle={`${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} — ${t($ => $.list.row, { count: record.items, xp: record.xp })} — ${agoStr(bound, record.diedAt)}`}
                    onPress={() => navigation.navigate('Detail', { graveId: record.id })}
                  />
                ))}
          </Panel>
        </Scroll>
      </Panel>
    </Card>
  );
}
