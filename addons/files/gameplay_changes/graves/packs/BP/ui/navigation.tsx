/** Navigation between the grave list, details and administration screens. */
import { compiledKeyOf } from '@bedrock-core/ui';
import { navigate } from '@bedrock-core/ui/navigation';
import type { Player } from '@minecraft/server';
import graveAdminScreen from './grave_admin.screen';
import graveDetailScreen from './grave_detail.screen';
import graveListScreen from './grave_list.screen';

const GraveAdminScreen = graveAdminScreen;
const GraveDetailScreen = graveDetailScreen;
const GraveListScreen = graveListScreen;

const open = (screen: unknown, player: Player, params: Readonly<Record<string, unknown>>, replace = false): void => {
  const key = compiledKeyOf(screen);

  if (key === undefined) {
    throw new Error('The Graves screen is not compiled. Rebuild the addon with its UI screens.');
  }

  navigate(key, player, { params, replace });
};

export const openGraveDetail = (player: Player, graveId: string): void => {
  open(GraveDetailScreen, player, { playerId: player.id, graveId });
};

export const openGraveList = (player: Player, page = 0, replace = false): void => {
  open(GraveListScreen, player, { playerId: player.id, page }, replace);
};

export const openAdminPanel = (player: Player, page = 0, replace = false): void => {
  open(GraveAdminScreen, player, { playerId: player.id, page }, replace);
};
