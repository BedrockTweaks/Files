import { Button, Container, ContainerEvent, Hotbar, Image, Panel, PlayerInventory, Slot, Text, useExit, useState, type JSX } from '@bedrock-core/ui';
import { GRAVE_ENTITY } from '../scripts/constants';
import { graveDocuments } from '../scripts/storage/documents';
import { retrieveAvailableItems, updateGraveContainer } from '../scripts/open/container';
import { authorize, consumeKey } from '../scripts/open/auth';
import { levelsForXp } from '../scripts/util';

const INVENTORY_ROWS = [0, 1, 2, 3] as const;
const INVENTORY_COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
const ARMOR_ROWS = [0, 1, 2, 3] as const;
const SLOT_SIZE = 18;
const HOTBAR_GAP = 3;
const EQUIPMENT_GAP = 4;
const CONTAINER_WIDTH = (INVENTORY_COLUMNS.length + 1) * SLOT_SIZE + EQUIPMENT_GAP + 14;
const HEADER_JOIN_DEPTH = 3;

const Cell = (): JSX.Element => (
  <Panel width={SLOT_SIZE} height={SLOT_SIZE} flexShrink={0} background={'textures/ui/slot_enabled'}>
    <Slot role={'output'} onRemove={updateGraveContainer} />
  </Panel>
);

/** A live number centered beneath the experience bottle. */
const XpLevels = ({ xp }: { xp: number }): JSX.Element => (
  <Text width={SLOT_SIZE} textAlign={'center'} maxLength={5} scale={0.7} color={[0.5, 1, 0.125]} shadow>
    {String(levelsForXp(xp))}
  </Text>
);

/** Source order keeps the 36 inventory cells before armor and offhand storage. */
const GraveLayout = ({ xp }: { xp: number }): JSX.Element => (
  <Panel flexShrink={0} paddingTop={7} paddingBottom={5} paddingLeft={7} paddingRight={7} flexDirection={'row-reverse'} gap={EQUIPMENT_GAP} zIndex={10} background={'textures/ui/dialog_background_opaque'}>
    <Panel flexDirection={'column'} gap={4}>
      <Panel flexDirection={'column'}>
        {INVENTORY_ROWS.map(row => (
          <Panel flexDirection={'row'} marginTop={row === 3 ? HOTBAR_GAP : 0}>
            {INVENTORY_COLUMNS.map(() => <Cell />)}
          </Panel>
        ))}
      </Panel>
      <Panel flexDirection={'column'} gap={HOTBAR_GAP}>
        <PlayerInventory />
        <Hotbar />
      </Panel>
    </Panel>
    <Panel width={SLOT_SIZE} flexDirection={'column'}>
      <Panel flexDirection={'column'}>
        {ARMOR_ROWS.map(() => <Cell />)}
      </Panel>
      <Cell />
      <Panel marginTop={3} flexDirection={'column'} alignItems={'center'} gap={2}>
        <Image texture={'textures/ui/graves/xp_bottle'} width={16} height={16} />
        <XpLevels xp={xp} />
      </Panel>
    </Panel>
  </Panel>
);

const GraveHeader = ({ owner }: { owner: string }): JSX.Element => {
  const exit = useExit();

  return (
    <Panel flexDirection={'row'} alignItems={'flex-start'} gap={8} zIndex={20}>
      <Panel flex={1} minWidth={0} alignSelf={'stretch'} justifyContent={'center'} marginTop={-1} marginBottom={-HEADER_JOIN_DEPTH - 1} paddingLeft={8} paddingRight={8} paddingTop={7} paddingBottom={7} background={'textures/ui/graves/name_tab'}>
        <Text maxLength={19} maxLines={1} overflow={'ellipsis'} color={[0.25, 0.25, 0.25]}>{owner}</Text>
      </Panel>
      <Panel flexShrink={0} marginTop={-1} marginBottom={-HEADER_JOIN_DEPTH} flexDirection={'column'}>
        <Panel paddingTop={4} paddingBottom={1} paddingLeft={8} paddingRight={6} flexDirection={'row'} alignItems={'center'} gap={4} background={'textures/ui/graves/toolbar'}>
          <Button
            width={25}
            height={18}
            zIndex={20}
            justifyContent={'center'}
            alignItems={'center'}
            background={'textures/ui/graves/retrieve_button'}
            backgroundHover={'textures/ui/graves/retrieve_button_hover'}
            backgroundPressed={'textures/ui/graves/retrieve_button_pressed'}
            onPress={retrieveAvailableItems}
          >
            <Image width={19} height={13} texture={'textures/ui/graves/retrieve_icon'} />
          </Button>
          <Button
            width={15}
            height={15}
            zIndex={20}
            background={'textures/ui/close_button_default_light'}
            backgroundHover={'textures/ui/close_button_hover_light'}
            backgroundPressed={'textures/ui/close_button_pressed_light'}
            onPress={exit}
          />
        </Panel>
        <Image texture={'textures/ui/graves/toolbar_tail'} width={4} height={HEADER_JOIN_DEPTH} alignSelf={'flex-end'} />
      </Panel>
    </Panel>
  );
};

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

/** A player-name tab above the grave, inventory, and XP controls. */
export default function GraveContainerScreen(): JSX.Element {
  const [owner, setOwner] = useState<string>('');
  const [xp, setXp] = useState<number>(0);

  return (
    <Container
      entity={GRAVE_ENTITY}
      width={CONTAINER_WIDTH}
      maxWidth={'100%'}
      maxHeight={'100%'}
      flexDirection={'column-reverse'}
      onOpen={event => openGrave(event, setOwner, setXp)}
      onClose={updateGraveContainer}
    >
      <Panel flex={1} flexBasis={0} />
      <GraveLayout xp={xp} />
      <Panel flex={1} flexBasis={0} justifyContent={'flex-end'}>
        <GraveHeader owner={owner} />
      </Panel>
    </Container>
  );
}
