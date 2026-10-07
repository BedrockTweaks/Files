import { graveDirectory, graveRecords } from '../storage/documents';
import { closeUi, Panel, Screen, Scroll, Text, useExit, useObservable, type JSX } from '@bedrock-core/ui';
import { Button, Card, Divider, Header, theme } from '@bedrock-core/ui/ore-styled';
import { isOperator } from '@bedrock-core/server';
import { world } from '@minecraft/server';

import { graveEntity, removeGrave } from '../lifecycle';

import { agoStr, causeText, dimensionOf, dimName, posStr } from '../util';
import { i18n } from './i18n';

const { spacing } = theme.tokens;

export interface GraveDetailScreenProps {
  playerId: string;
  graveId: string;
  onBack: () => void;
}

/** One grave, read reactively from the authoritative collection document. */
export default function GraveDetailScreen({ playerId, graveId, onBack }: GraveDetailScreenProps): JSX.Element {
  const exit = useExit();
  const document = useObservable(graveRecords);
  const record = document?.records[graveId];
  const player = playerId ? world.getAllPlayers().find(candidate => candidate.id === playerId) : undefined;
  const bound = player ? i18n.forPlayer(player) : undefined;
  const admin = player !== undefined && isOperator(player);

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
    closeUi(player);
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

    onBack();
  };

  return (
    <Screen>
      <Card flexDirection={'column'} padding={0} gap={0}>
        <Header title={i18n.key($ => $.detail.title)} onBack={onBack} onClose={exit} />
        <Panel flexGrow={1} flexDirection={'column'} padding={spacing.sm} gap={spacing.sm}>
          <Panel flexGrow={1}>
            <Scroll>
              <Panel flexDirection={'column'} gap={spacing.xs}>
                <Text visible={!record}>{i18n.key($ => $.list.empty)}</Text>
                <Text maxLength={48}>{record && bound ? `${bound.t($ => $.detail.owner)}: ${record.ownerName}` : ''}</Text>
                <Text maxLength={48}>{record && bound ? `${bound.t($ => $.detail.dimension)}: ${dimName(bound, record.dim)}` : ''}</Text>
                <Text maxLength={48}>{record && bound ? `${bound.t($ => $.detail.position)}: ${posStr(record.x, record.y, record.z)}` : ''}</Text>
                <Divider />
                <Text maxLength={32}>{record && bound ? bound.t($ => $.detail.items, { count: record.items }) : ''}</Text>
                <Text maxLength={24}>{record && bound ? bound.t($ => $.detail.xp, { amount: record.xp }) : ''}</Text>
                <Text maxLength={48}>{record && bound ? `${bound.t($ => $.detail.when)}: ${agoStr(bound, record.diedAt)}` : ''}</Text>
                <Text maxLength={64}>{record && bound ? causeText(bound, record.cause, record.killer) ?? '' : ''}</Text>
                <Text maxLength={48}>{record?.floating && bound ? `§6${bound.t($ => $.list.floating)}` : ''}</Text>
                <Text maxLength={48}>{record?.purge && bound ? `§c${bound.t($ => $.detail.pendingPurge)}` : ''}</Text>
              </Panel>
            </Scroll>
          </Panel>
          <Divider visible={admin} />
          <Panel visible={admin} flexDirection={'row'} gap={spacing.md}>
            <Button flex={1} enabled={record !== undefined} onPress={teleport}>{i18n.key($ => $.detail.teleport)}</Button>
            <Button flex={1} variant={'danger'} enabled={record !== undefined} onPress={purge}>{i18n.key($ => $.detail.purge)}</Button>
          </Panel>
        </Panel>
      </Card>
    </Screen>
  );
}
