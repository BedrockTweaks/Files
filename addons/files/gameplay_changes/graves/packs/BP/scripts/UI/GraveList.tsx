/**
 * The player's own graves — one row per grave, newest first. Replaces the
 * Java pack's paginated tellraw list; the scroll region below the header
 * handles overflow, matching the core `ui(core)` screen shell.
 *
 * Each row carries its own locator-bar checkbox. This screen is the ONLY place
 * that control exists, because it is the only screen that shows graves the
 * viewer owns — the admin panel lists everyone's, and a waypoint onto someone
 * else's death pile is not something this addon offers from anywhere.
 */
import { Panel, Scroll, Text, usePlayer, useExit, useState, useTranslation, type JSX } from '@bedrock-core/ui';
import { Card, Checkbox, Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import type { ScreenProps } from '@bedrock-core/ui/navigation';
import { i18n } from './i18n';
import { SettingsButton } from './SettingsButton';
import { updateRecord, visibleRecordsOf } from '../index/store';
import { agoStr, dimName, posStr } from '../util';
import type { GraveRecord } from '../types';
import type { GravesRoutes } from './GravesApp';

const { fontColor, spacing } = theme.tokens;

export function GraveList({ navigation }: ScreenProps<GravesRoutes, 'List'>): JSX.Element {
  const player = usePlayer();
  const bound = useTranslation(i18n);
  const exit = useExit();
  const { t, key } = bound;

  // Re-read on every toggle: the checkbox writes to the index, and the index —
  // not this component — is what the locator bar and the next open both read.
  const [revision, setRevision] = useState(0);
  const records = [...visibleRecordsOf(player.id)].sort((a, b) => b.diedAt - a.diedAt);

  const toggleWaypoint = (record: GraveRecord, show: boolean): void => {
    // `undefined` rather than a false flag: the index is JSON, so the key
    // simply stops being written, and "absent means shown" stays the one rule.
    updateRecord({ ...record, noWaypoint: show ? undefined : true });
    setRevision(revision + 1);
  };

  return (
    <Card flexDirection={'column'} padding={0} gap={0}>
      <Header title={key($ => $.list.title)} onClose={exit} />
      <SettingsButton />
      <Panel flexGrow={1} flexDirection={'column'} padding={spacing.sm} gap={spacing.xs}>
        {records.length === 0
          ? <Text>{t($ => $.list.empty)}</Text>
          : (
              <Panel flexGrow={1} flexDirection={'column'} gap={spacing.xs}>
                <Text wordBreak={'break-word'}>{`${fontColor.muted}${t($ => $.list.waypointHint)}`}</Text>
                <Panel flexGrow={1}>
                  <Scroll>
                    <Panel flexDirection={'column'} gap={spacing.xs}>
                      {records.map(record => (
                        <Panel flexDirection={'row'} alignItems={'center'} gap={spacing.xs}>
                          <Panel flexGrow={1}>
                            <MenuRow
                              title={t($ => $.list.row, { count: record.items, xp: record.xp })}
                              subtitle={`${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} · ${agoStr(bound, record.diedAt)}${record.floating ? ` · ${t($ => $.list.floating)}` : ''}`}
                              onPress={() => navigation.navigate('Detail', { graveId: record.id })}
                            />
                          </Panel>
                          <Checkbox
                            checked={!record.noWaypoint}
                            onChange={(show): void => toggleWaypoint(record, show)}
                          />
                        </Panel>
                      ))}
                    </Panel>
                  </Scroll>
                </Panel>
              </Panel>
            )}
      </Panel>
    </Card>
  );
}
