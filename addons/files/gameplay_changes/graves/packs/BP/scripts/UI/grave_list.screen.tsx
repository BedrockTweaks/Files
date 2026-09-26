import { graveDirectory, graveRecords } from '../storage/documents';
import { List, Panel, Screen, Scroll, Text, useExit, useObservable, useState, type JSX } from '@bedrock-core/ui';
import { Button, Card, Checkbox, Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import { world } from '@minecraft/server';
import { config } from '../registration';
import { agoStr, dimName, posStr } from '../util';
import { i18n } from './i18n';

const { spacing } = theme.tokens;
const ROWS_PER_PAGE = 8;

export interface GraveListScreenProps {
  playerId: string;
  onOpen?: (graveId: string) => void;
}

interface GraveListRow {
  graveId: string;
  title: string;
  subtitle: string;
  waypoint: boolean;
}

/** The viewer's graves, derived from the live world collection. */
export default function GraveListScreen({ playerId, onOpen }: GraveListScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const [page, setPage] = useState(0);
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
  const currentPage = Math.min(page, pages - 1);
  const shown = rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  return (
    <Screen>
      <Card flexDirection={'column'} padding={0} gap={0}>
        <Header title={i18n.key($ => $.list.title)} onClose={exit} />
        <Button
          position={'absolute'}
          top={4}
          left={4}
          zIndex={2}
          variant={'transparent'}
          width={18}
          height={18}
          paddingLeft={0}
          paddingRight={0}
          paddingTop={0}
          paddingBottom={0}
          background={'textures/ui/settings_glyph_color_2x'}
          backgroundHover={'textures/ui/settings_glyph_color_2x'}
          backgroundPressed={'textures/ui/settings_glyph_color_2x'}
          onPress={() => {
            if (player) {
              void config.open(player);
            }
          }}
        />
        <Panel flexGrow={1} flexDirection={'column'} padding={spacing.sm} gap={spacing.xs}>
          <Text wordBreak={'break-word'}>{i18n.key($ => $.list.waypointHint)}</Text>
          <Text visible={rows.length === 0}>{i18n.key($ => $.list.empty)}</Text>
          <Panel flexGrow={1}>
            <Scroll>
              <List
                max={ROWS_PER_PAGE}
                items={shown}
                gap={spacing.xs}
                row={(row: GraveListRow | undefined): JSX.Element => (
                  <Panel flexDirection={'row'} alignItems={'center'} gap={spacing.xs}>
                    <Panel flexGrow={1}>
                      <MenuRow
                        title={row?.title ?? ''}
                        subtitle={row?.subtitle ?? ''}
                        titleMaxLength={32}
                        subtitleMaxLength={72}
                        enabled={row !== undefined}
                        onPress={() => {
                          if (row) {
                            onOpen?.(row.graveId);
                          }
                        }}
                      />
                    </Panel>
                    <Checkbox
                      on={row?.waypoint ?? false}
                      enabled={row !== undefined}
                      onChange={(shown): void => {
                        const record = row && graveDirectory.get()?.records[row.graveId];

                        if (record) {
                          graveDirectory.patch({ records: { [record.id]: { ...record, noWaypoint: shown ? undefined : true } } });
                        }
                      }}
                    />
                  </Panel>
                )}
              />
            </Scroll>
          </Panel>
          <Panel flexDirection={'row'} justifyContent={'center'} alignItems={'center'} gap={spacing.sm}>
            <Button variant={'secondary'} enabled={currentPage > 0} onPress={() => setPage(value => Math.max(0, value - 1))}>{'<'}</Button>
            <Text maxLength={12}>{`${String(currentPage + 1)} of ${String(pages)}`}</Text>
            <Button variant={'secondary'} enabled={currentPage + 1 < pages} onPress={() => setPage(value => Math.min(pages - 1, value + 1))}>{'>'}</Button>
          </Panel>
        </Panel>
      </Card>
    </Screen>
  );
}
