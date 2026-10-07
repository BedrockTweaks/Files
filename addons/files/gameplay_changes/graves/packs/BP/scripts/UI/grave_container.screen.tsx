import { Container, ContainerEvent, Hotbar, Panel, PlayerInventory, Slot, Text, useExit, useState, type JSX } from '@bedrock-core/ui';
import { Button, Card, Divider } from '@bedrock-core/ui/ore-styled';
import { GRAVE_ENTITY } from '../constants';
import { graveDocuments } from '../storage/documents';
import { updateGraveContainer } from '../open/container';
import { authorize, consumeKey } from '../open/auth';
import { i18n } from './i18n';

const INVENTORY_ROWS = [0, 1, 2, 3] as const;
const INVENTORY_COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const EQUIPMENT = [0, 1, 2, 3, 4] as const;
const SLOT_SIZE = 18;
const EQUIPMENT_GAP = 4;
const GRAVE_GRID_WIDTH = INVENTORY_COLUMNS.length * SLOT_SIZE;

const Cell = (): JSX.Element => (
  <Panel width={SLOT_SIZE} height={SLOT_SIZE} background={'textures/ui/slot_enabled'} flexShrink={0}>
    <Slot role={'both'} onInsert={updateGraveContainer} onRemove={updateGraveContainer} />
  </Panel>
);

/**
 * The grave's 36 inventory cells are emitted before its five equipment cells
 * because that order is the capture/restore contract. Their storage order is
 * three main-inventory rows followed by the hotbar row. Margins move the later
 * equipment rail to the left without changing that contract.
 */
const GraveLayout = (): JSX.Element => (
  <Panel
    flexShrink={0}
    flexDirection={'row'}
    alignItems={'flex-start'}
    gap={0}
  >
    <Panel marginLeft={SLOT_SIZE + EQUIPMENT_GAP} flexDirection={'column'} gap={0}>
      {INVENTORY_ROWS.map((_, i) => (
        <Panel flexDirection={'row'} gap={0} marginTop={i === 3 ? 2 : 0}>
          {INVENTORY_COLUMNS.map(() => <Cell />)}
        </Panel>
      ))}
    </Panel>
    <Panel marginLeft={-(GRAVE_GRID_WIDTH + EQUIPMENT_GAP + SLOT_SIZE)} flexDirection={'column'} gap={0}>
      {EQUIPMENT.map(() => <Cell />)}
    </Panel>
  </Panel>
);

const openGrave = (event: ContainerEvent, setOwner: (owner: string) => void, setXp: (xp: number) => void): void => {
  const { host, player } = event;

  if ('permutation' in host) {
    return;
  }

  const stored = graveDocuments.for(host).get();
  const auth = authorize(player, host);

  if (!auth.allowed) {
    return;
  }

  if (auth.needsKey) {
    consumeKey(player);
  }

  setOwner(stored?.ownerName ?? '');
  setXp(stored?.xp ?? 0);
  updateGraveContainer(event);
};

/**
 * A grave container has one shared shell: metadata on the left, the grave
 * above the viewer inventory on the right, and one close action in the corner.
 * The viewer's armor collection is not exposed by Bedrock Core 0.12, so the
 * supported player collections remain inventory and hotbar here.
 */
export default function GraveContainerScreen(): JSX.Element {
  const [owner, setOwner] = useState<string>('');
  const [xp, setXp] = useState<number>(0);
  const exit = useExit();

  return (
    <Container
      entity={GRAVE_ENTITY}
      flexDirection={'row'}
      alignItems={'stretch'}
      padding={4}
      gap={2}
      background={'textures/ui/dialog_background_opaque'}
      onOpen={event => openGrave(event, setOwner, setXp)}
      onClose={updateGraveContainer}
    >
      <Card width={92} flexDirection={'column'} padding={2} paddingBottom={4} gap={2}>
        <Text>{i18n.key($ => $.meta.name)}</Text>
        <Text maxLength={24}>{owner}</Text>
        <Panel flexGrow={1} />
        <Text maxLength={16}>{`XP ${String(xp)}`}</Text>
      </Card>

      <Panel
        flexGrow={1}
        flexDirection={'column'}
        alignItems={'center'}
        marginTop={8}
        marginBottom={8}
        gap={2}
      >
        <GraveLayout />
        <Divider />
        <PlayerInventory />
        <Hotbar />
      </Panel>

      <Button
        variant={'transparent'}
        width={14}
        height={14}
        position={'absolute'}
        top={4}
        right={4}
        background={'textures/ui/close_button_default'}
        backgroundHover={'textures/ui/close_button_hover'}
        backgroundPressed={'textures/ui/close_button_pressed'}
        onPress={exit}
      />
    </Container>
  );
}
