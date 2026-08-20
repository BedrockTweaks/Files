/**
 * One grave: text summary only — no item icons by design (§4: ItemRenderer
 * aux ids are unreliable in multi-addon worlds). Operators get teleport and
 * purge actions.
 */
import { Panel, Text, usePlayer, useExit, useTranslation, type JSX } from '@bedrock-core/ui';
import { Button, Card, Divider, Header, theme } from '@bedrock-core/ui/ore-styled';
import { isOperator } from '@bedrock-core/server';
import { world } from '@minecraft/server';
import type { ScreenProps } from '@bedrock-core/ui/navigation';
import { i18n } from './i18n';
import { byEntityId, markPurge } from '../index/store';
import { graveEntity, removeGrave } from '../lifecycle';
import { agoStr, causeText, dimName, posStr } from '../util';
import type { GravesRoutes } from './GravesApp';

const { fontColor, spacing } = theme.tokens;

export function GraveDetail({ navigation, route }: ScreenProps<GravesRoutes, 'Detail'>): JSX.Element {
  const player = usePlayer();
  const bound = useTranslation(i18n);
  const exit = useExit();
  const { t, key } = bound;

  const record = byEntityId(route.params.graveId);

  if (!record) {
    // Looted or purged while this screen was open.
    return (
      <Panel flexDirection={'column'} padding={spacing.md} gap={spacing.md}>
        <Header title={key($ => $.detail.title)} onBack={() => navigation.goBack()} onClose={exit} />
        <Text>{t($ => $.list.empty)}</Text>
      </Panel>
    );
  }

  const admin = isOperator(player);
  const cause = causeText(bound, record.cause, record.killer);

  const teleport = (): void => {
    player.teleport(
      { x: record.x + 0.5, y: record.y, z: record.z + 0.5 },
      { dimension: world.getDimension(record.dim) },
    );
    exit();
  };

  const purge = (): void => {
    const entity = graveEntity(record.id);

    if (entity) {
      removeGrave(entity);
    } else {
      markPurge(record.id);
    }

    navigation.goBack();
  };

  return (
    <Panel flexDirection={'column'} padding={spacing.md} gap={spacing.md}>
      <Header title={key($ => $.detail.title)} breadcrumbs={[record.ownerName]} onBack={() => navigation.goBack()} onClose={exit} />
      <Card>
        <Text>{`${fontColor.muted}${t($ => $.detail.owner)}: §r${record.ownerName}`}</Text>
        <Text>{`${fontColor.muted}${t($ => $.detail.dimension)}: §r${dimName(bound, record.dim)}`}</Text>
        <Text>{`${fontColor.muted}${t($ => $.detail.position)}: §r${posStr(record.x, record.y, record.z)}`}</Text>
        <Divider />
        <Text>{t($ => $.detail.items, { count: record.items })}</Text>
        <Text>{t($ => $.detail.xp, { amount: record.xp })}</Text>
        <Text>{`${t($ => $.detail.when)}: ${agoStr(bound, record.diedAt)}`}</Text>
        {cause ? <Text>{cause}</Text> : undefined}
        {record.floating ? <Text>{`§6${t($ => $.list.floating)}`}</Text> : undefined}
        {record.purge ? <Text>{`§c${t($ => $.detail.pendingPurge)}`}</Text> : undefined}
      </Card>
      {admin
        ? (
            <Panel flexDirection={'row'} gap={spacing.md}>
              <Button flex={1} onPress={teleport}>{t($ => $.detail.teleport)}</Button>
              <Button flex={1} variant={'danger'} onPress={purge}>{t($ => $.detail.purge)}</Button>
            </Panel>
          )
        : undefined}
      <Button onPress={exit}>{t($ => $.detail.close)}</Button>
    </Panel>
  );
}
