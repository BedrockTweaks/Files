import { Container, EntityComponentTypes, EntityInventoryComponent, ItemStack, Player } from '@minecraft/server';
import { GravesItemTypes } from '../Models/ItemTypes';

export const giveGraveKey = (player: Player): void => {
  const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;

  playerContainer.addItem(new ItemStack(GravesItemTypes.GraveKey));
};
