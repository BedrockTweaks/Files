/** Navigation between the grave list, details and administration screens. */
import { render } from '@bedrock-core/ui';
import type { Player } from '@minecraft/server';
import graveAdminScreen from './grave_admin.screen';
import graveDetailScreen from './grave_detail.screen';
import graveListScreen from './grave_list.screen';

const GraveAdminScreen = graveAdminScreen;
const GraveDetailScreen = graveDetailScreen;
const GraveListScreen = graveListScreen;

const openGraveDetail = (player: Player, graveId: string, onBack: () => void): void => {
  render(<GraveDetailScreen playerId={player.id} graveId={graveId} onBack={onBack} />, player);
};

export const openGraveList = (player: Player): void => {
  render(<GraveListScreen playerId={player.id} onOpen={graveId => openGraveDetail(player, graveId, () => openGraveList(player))} />, player);
};

export const openAdminPanel = (player: Player): void => {
  render(<GraveAdminScreen playerId={player.id} onOpen={graveId => openGraveDetail(player, graveId, () => openAdminPanel(player))} />, player);
};
