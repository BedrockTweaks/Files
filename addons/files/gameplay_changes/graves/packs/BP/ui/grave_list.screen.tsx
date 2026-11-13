import { graveRecords } from '../scripts/storage/documents';
import { List, Panel, Screen, Scroll, Text, useExit, useObservable, type JSX } from '@bedrock-core/ui';
import { Card, Checkbox, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import { world } from '@minecraft/server';
import { config } from '../scripts/registration';
import { agoStr, dimName, posStr } from '../scripts/util';
import { i18n } from '../i18n';
import { GravePageHeader, GravePagination } from './layout';
import { setWaypointVisibility } from './waypoints';
import { openGraveDetail, openGraveList } from './navigation';

const { spacing } = theme.tokens;
const ROWS_PER_PAGE = 8;

export interface GraveListScreenProps {
  playerId: string;
  page?: number;
}

interface GraveListRow {
  graveId: string;
  title: string;
  subtitle: string;
  waypoint: boolean;
}

/** The viewer's graves, derived from the live world collection. */
export default function GraveListScreen({ playerId, page = 0 }: GraveListScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const player = playerId ? world.getAllPlayers().find(candidate => candidate.id === playerId) : undefined;
  const bound = player ? i18n.forPlayer(player) : undefined;
  const rows: GraveListRow[] = !bound
    ? []
    : Object.values(document?.records ?? {})
        .filter(record => record.owner === playerId && !record.purge)
        .sort((a, b) => b.diedAt - a.diedAt)
        .map(record => ({
          graveId: record.id,
          title: bound.t($ => $.list.row, { count: record.items, xp: record.xp }),
          subtitle: `${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} · ${agoStr(bound, record.diedAt)}${record.floating ? ` · ${bound.t($ => $.list.floating)}` : ''}`,
          waypoint: !record.noWaypoint,
        }));
  const pages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(Number.isSafeInteger(page) ? Math.max(0, page) : 0, pages - 1);
  const shown = rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  return (
    <Screen>
      <Card flex={1} minHeight={0} maxHeight={'100%'} flexDirection={'column'} padding={0} gap={0}>
        <GravePageHeader
          title={i18n.key($ => $.list.title)}
          onClose={exit}
          onSettings={() => player ? config.open(player) : undefined}
        />
        <Panel flex={1} minHeight={0} flexDirection={'column'} padding={spacing.sm} gap={spacing.xs}>
          <Text wordBreak={'break-word'}>{i18n.key($ => $.list.waypointHint)}</Text>
          <Text liveVisible visible={rows.length === 0}>{i18n.key($ => $.list.empty)}</Text>
          <Scroll flex={1} minHeight={0}>
            <List
              max={ROWS_PER_PAGE}
              items={shown}
              gap={spacing.xs}
              row={(row: GraveListRow | undefined, index: number): JSX.Element => (
                <Panel flexDirection={'row'} alignItems={'center'} gap={spacing.xs}>
                  <MenuRow
                    flex={1}
                    minWidth={0}
                    title={row?.title ?? ''}
                    subtitle={row?.subtitle ?? ''}
                    titleMaxLength={32}
                    subtitleMaxLength={72}
                    enabled={row !== undefined}
                    onPress={() => {
                      if (row && player) {
                        openGraveDetail(player, row.graveId);
                      }
                    }}
                  />
                  <Checkbox
                    key={`waypoint-${row?.graveId ?? String(index)}-${String(row?.waypoint ?? false)}`}
                    defaultValue={row?.waypoint ?? false}
                    flexShrink={0}
                    enabled={row !== undefined}
                    onChange={(visible): void => {
                      if (row) {
                        setWaypointVisibility(row.graveId, visible);
                      }
                    }}
                  />
                </Panel>
              )}
            />
          </Scroll>
          <GravePagination
            page={currentPage}
            pages={pages}
            onPrevious={() => {
              if (player) {
                openGraveList(player, Math.max(0, currentPage - 1), true);
              }
            }}
            onNext={() => {
              if (player) {
                openGraveList(player, Math.min(pages - 1, currentPage + 1), true);
              }
            }}
          />
        </Panel>
      </Card>
    </Screen>
  );
}
