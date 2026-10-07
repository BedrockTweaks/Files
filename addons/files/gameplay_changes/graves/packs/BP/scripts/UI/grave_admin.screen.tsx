import { graveRecords } from '../storage/documents';
import { List, Panel, Screen, Scroll, Text, useExit, useObservable, useState, type JSX } from '@bedrock-core/ui';
import { Button, Card, Header, MenuRow, theme } from '@bedrock-core/ui/ore-styled';
import { world } from '@minecraft/server';
import { config } from '../registration';
import { agoStr, dimName, posStr } from '../util';
import { i18n } from './i18n';

const { spacing } = theme.tokens;
const ROWS_PER_PAGE = 8;

export interface GraveAdminScreenProps {
  playerId: string;
  onOpen?: (graveId: string) => void;
}

interface GraveAdminRow {
  graveId: string;
  owner: string;
  subtitle: string;
}

/** Every live grave record, paged into a fixed compiled screen. */
export default function GraveAdminScreen({ playerId, onOpen }: GraveAdminScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const [page, setPage] = useState(0);
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
  const currentPage = Math.min(page, pages - 1);
  const shown = rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE);

  return (
    <Screen>
      <Card flexDirection={'column'} padding={0} gap={0}>
        <Header title={i18n.key($ => $.admin.title)} onClose={exit} />
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
          <Text visible={rows.length === 0}>{i18n.key($ => $.admin.empty)}</Text>
          <Panel flexGrow={1}>
            <Scroll>
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
                      if (row) {
                        onOpen?.(row.graveId);
                      }
                    }}
                  />
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
