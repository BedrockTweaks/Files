/**
 * Gear button seated in the header's empty back slot — an absolute overlay
 * with the same metrics as the ore back control (header margins 1 + padding,
 * iconSize square). Opens this addon's settings through the shared `ui(core)`
 * config UI. The main list and the admin panel wear it; detail keeps back.
 */
import { usePlayer, type JSX } from '@bedrock-core/ui';
import { openUi } from '@bedrock-core/ui/config';
import { Button, theme } from '@bedrock-core/ui/ore-styled';
import { core } from '../registration';

/** Vanilla dark gear glyph — reads on the light ore header like the §0 title. */
const GEAR = 'textures/ui/settings_glyph_color_2x';

export function SettingsButton(): JSX.Element {
  const player = usePlayer();
  const h = theme.components.header;

  return (
    <Button
      position={'absolute'}
      top={1 + h.padding}
      left={1 + h.padding}
      zIndex={1}
      width={h.iconSize}
      height={h.iconSize}
      background={GEAR}
      backgroundHover={GEAR}
      backgroundPressed={GEAR}
      paddingLeft={0}
      paddingRight={0}
      paddingTop={0}
      paddingBottom={0}
      onPress={() => openUi(core, player, { kind: 'config', addonId: core.id })}
    />
  );
}
