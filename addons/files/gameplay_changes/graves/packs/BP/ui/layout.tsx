import { Button as IconButton, Panel, Text, type JSX } from '@bedrock-core/ui';
import { Button, theme } from '@bedrock-core/ui/ore-styled';

const { spacing } = theme.tokens;

export const GravePageHeader = ({ title, onSettings, onClose }: { title: string; onSettings: () => void | Promise<void>; onClose: () => void }): JSX.Element => {
  const header = theme.components.header;
  const settings = 'textures/ui/settings_glyph_color_2x';

  return (
    <Panel flexDirection={'row'} alignItems={'center'} padding={header.padding} gap={header.gap} marginTop={1} marginLeft={1} marginRight={1} flexShrink={0} background={header.textures.background}>
      <IconButton width={header.iconSize} height={header.iconSize} background={settings} backgroundHover={settings} backgroundPressed={settings} onPress={onSettings} />
      <Text flex={1} minWidth={0} textAlign={'center'} maxLines={1} overflow={'ellipsis'} font={header.textStyle.font} scale={header.textStyle.scale} color={header.textStyle.colorRgb}>{title}</Text>
      <IconButton width={header.iconSize} height={header.iconSize} background={header.textures.close} backgroundHover={header.textures.closeHover} backgroundPressed={header.textures.closePressed} onPress={onClose} />
    </Panel>
  );
};

export const GravePagination = ({ page, pages, onPrevious, onNext }: { page: number; pages: number; onPrevious: () => void; onNext: () => void }): JSX.Element => (
  <Panel flexShrink={0} flexDirection={'row'} justifyContent={'center'} alignItems={'center'} gap={spacing.sm}>
    <Button variant={'secondary'} enabled={page > 0} onPress={onPrevious}>{'<'}</Button>
    <Text maxLength={12} textAlign={'center'}>{`${String(page + 1)} of ${String(pages)}`}</Text>
    <Button variant={'secondary'} enabled={page + 1 < pages} onPress={onNext}>{'>'}</Button>
  </Panel>
);
