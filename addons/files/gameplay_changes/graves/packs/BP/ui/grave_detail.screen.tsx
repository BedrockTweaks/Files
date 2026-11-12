import { graveDirectory, graveRecords } from '../scripts/storage/documents';
import { Panel, Screen, Scroll, Text, useExit, useObservable, type JSX } from '@bedrock-core/ui';
import { Button, Card, Divider, Header, theme } from '@bedrock-core/ui/ore-styled';
import { isOperator } from '@bedrock-core/server';
import { back } from '@bedrock-core/ui/navigation';
import { world } from '@minecraft/server';

import { graveEntity, removeGrave } from '../scripts/lifecycle';

import { agoStr, causeText, dimensionOf, dimName, posStr } from '../scripts/util';
import { i18n } from '../i18n';
import { openGraveList } from './navigation';

const { spacing } = theme.tokens;

export interface GraveDetailScreenProps {
  playerId: string;
  graveId: string;
}

/** One grave, read reactively from the authoritative collection document. */
export default function GraveDetailScreen({ playerId, graveId }: GraveDetailScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const record = document?.records[graveId];
  const player = playerId ? world.getAllPlayers().find(candidate => candidate.id === playerId) : undefined;
  const bound = player ? i18n.forPlayer(player) : undefined;
  const admin = player !== undefined && isOperator(player);

  const goBack = (): void => {
    if (player && !back(player)) {
      openGraveList(player, 0, true);
    }
  };

  const teleport = (): void => {
    if (!record || !player) {
      return;
    }

    const dimension = dimensionOf(record.dim);

    if (!dimension) {
      console.warn(`[graves] cannot teleport to grave ${record.id}: dimension '${record.dim}' is gone`);

      return;
    }

    player.teleport({ x: record.x + 0.5, y: record.y, z: record.z + 0.5 }, { dimension });
    exit();
  };

  const purge = (): void => {
    if (!record) {
      return;
    }

    const entity = graveEntity(record.id);

    if (entity) {
      removeGrave(entity);
    } else {
      graveDirectory.patch({ records: { [record.id]: { ...record, purge: true } } });
    }

    goBack();
  };

  return (
    <Screen>
      <Card flex={1} minHeight={0} maxHeight={'100%'} flexDirection={'column'} padding={0} gap={0}>
        <Header title={i18n.key($ => $.detail.title)} onBack={goBack} onClose={exit} flexShrink={0} />
        <Panel flex={1} minHeight={0} flexDirection={'column'} padding={spacing.sm} gap={spacing.sm}>
          <Scroll flex={1} minHeight={0}>
            <Panel stack flexDirection={'column'} gap={spacing.xs}>
              <Text liveVisible visible={!record}>{i18n.key($ => $.list.empty)}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record && bound ? `${bound.t($ => $.detail.owner)}: ${record.ownerName}` : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record && bound ? `${bound.t($ => $.detail.dimension)}: ${dimName(bound, record.dim)}` : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record && bound ? `${bound.t($ => $.detail.position)}: ${posStr(record.x, record.y, record.z)}` : ''}</Text>
              <Divider />
              <Text wordBreak={'break-word'} maxLength={32}>{record && bound ? bound.t($ => $.detail.items, { count: record.items }) : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={24}>{record && bound ? bound.t($ => $.detail.xp, { amount: record.xp }) : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record && bound ? `${bound.t($ => $.detail.when)}: ${agoStr(bound, record.diedAt)}` : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={64}>{record && bound ? causeText(bound, record.cause, record.killer) ?? '' : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record?.floating && bound ? `§6${bound.t($ => $.list.floating)}` : ''}</Text>
              <Text wordBreak={'break-word'} maxLength={48}>{record?.purge && bound ? `§c${bound.t($ => $.detail.pendingPurge)}` : ''}</Text>
            </Panel>
          </Scroll>
          <Divider liveVisible visible={admin} />
          <Panel liveVisible visible={admin} flexShrink={0} flexDirection={'row'} gap={spacing.md}>
            <Button flex={1} enabled={record !== undefined} onPress={teleport}>
              <Text textAlign={'center'}>{i18n.raw($ => $.detail.teleport)}</Text>
            </Button>
            <Button flex={1} variant={'danger'} enabled={record !== undefined} onPress={purge}>
              <Text textAlign={'center'}>{i18n.raw($ => $.detail.purge)}</Text>
            </Button>
          </Panel>
        </Panel>
      </Card>
    </Screen>
  );
}
