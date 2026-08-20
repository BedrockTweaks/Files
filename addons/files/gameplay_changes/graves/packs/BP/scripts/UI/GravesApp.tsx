/**
 * The addon's own screen stack: grave list → detail, plus the operator panel.
 * The shared config/guide/list screens come from `ui(core)` — nothing here
 * touches those. Note our list command is `<ns>:graves`, because `ui(core)`
 * already claims `<ns>:list` for the addon list.
 */
import { render, type JSX } from '@bedrock-core/ui';
import { createStackNavigator, NavigationContainer } from '@bedrock-core/ui/navigation';
import type { Player } from '@minecraft/server';
import { GraveList } from './GraveList';
import { GraveDetail } from './GraveDetail';
import { AdminPanel } from './AdminPanel';

export type GravesRoutes = {
  List: undefined;
  Admin: undefined;
  Detail: { graveId: string };
};

const Stack = createStackNavigator<GravesRoutes>({
  screens: {
    List: GraveList,
    Admin: AdminPanel,
    Detail: GraveDetail,
  },
  initialRouteName: 'List',
});

function GravesApp({ initialRoute }: { initialRoute: 'List' | 'Admin' }): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} />
    </NavigationContainer>
  );
}

export const openGraveList = (player: Player): void => render(<GravesApp initialRoute={'List'} />, player);

export const openAdminPanel = (player: Player): void => render(<GravesApp initialRoute={'Admin'} />, player);
