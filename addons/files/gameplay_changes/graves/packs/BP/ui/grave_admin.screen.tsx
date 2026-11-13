import { graveRecords } from '../scripts/storage/documents';
import { List, Panel, Screen, Scroll, Text, useExit, useObservable, type JSX } from '@bedrock-core/ui';
import { Card, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import { world } from '@minecraft/server';
import { config } from '../scripts/registration';
import { agoStr, dimName, posStr } from '../scripts/util';
import { i18n } from '../i18n';
import { GravePageHeader, GravePagination } from './layout';
import { openAdminPanel, openGraveDetail } from './navigation';

const { spacing } = theme.tokens;
const ROWS_PER_PAGE = 8;

export interface GraveAdminScreenProps {
  playerId: string;
  page?: number;
}

interface GraveAdminRow {
  graveId: string;
  owner: string;
  subtitle: string;
}

/** Every live grave record, paged into a fixed compiled screen. */
export default function GraveAdminScreen({ playerId, page = 0 }: GraveAdminScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const player = playerId ? world.getAllPlayers().find(candidate => candidate.id === playerId) : undefined;
  const bound = player ? i18n.forPlayer(player) : undefined;
  const rows: GraveAdminRow[] = !bound
    ? []
    : Object.values(document?.records ?? {})
        .filter(record => !record.purge)
        .sort((a, b) => b.diedAt - a.diedAt)
        .map(record => ({
          graveId: record.id,
          owner: record.ownerName,
          subtitle: `${dimName(bound, record.dim)} ${posStr(record.x, record.y, record.z)} · ${agoStr(bound, record.diedAt)}`,
        }));
  const pages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(Number.isSafeInteger(page) ? Math.max(0, page) : 0, pages - 1);
  const shown = rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  return (
    <Screen>
      <Card flex={1} minHeight={0} maxHeight={'100%'} flexDirection={'column'} padding={0} gap={0}>
        <GravePageHeader
          title={i18n.key($ => $.admin.title)}
          onClose={exit}
          onSettings={() => player ? config.open(player) : undefined}
        />
        <Panel flex={1} minHeight={0} flexDirection={'column'} padding={spacing.sm} gap={spacing.xs}>
          <Text liveVisible visible={rows.length === 0}>{i18n.key($ => $.admin.empty)}</Text>
          <Scroll flex={1} minHeight={0}>
            <List
              max={ROWS_PER_PAGE}
              items={shown}
              gap={spacing.xs}
              row={(row: GraveAdminRow | undefined): JSX.Element => (
                <MenuRow
                  title={row?.owner ?? ''}
                  subtitle={row?.subtitle ?? ''}
                  titleMaxLength={24}
                  subtitleMaxLength={80}
                  enabled={row !== undefined}
                  onPress={() => {
                    if (row && player) {
                      openGraveDetail(player, row.graveId);
                    }
                  }}
                />
              )}
            />
          </Scroll>
          <GravePagination
            page={currentPage}
            pages={pages}
            onPrevious={() => {
              if (player) {
                openAdminPanel(player, Math.max(0, currentPage - 1), true);
              }
            }}
            onNext={() => {
              if (player) {
                openAdminPanel(player, Math.min(pages - 1, currentPage + 1), true);
              }
            }}
          />
        </Panel>
      </Card>
    </Screen>
  );
}
