import {
  Container,
  Entity,
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  Player
} from '@minecraft/server';
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data';

export const spawnGrave = (player: Player): void => {
  let graveLocation = player.location;
  if (
    player.dimension.id === MinecraftDimensionTypes.Overworld
    && player.location.y < -63) {
    graveLocation = {
      ...player.location,
      y: -63,
    };
  }
  if (
    (player.dimension.id === MinecraftDimensionTypes.TheEnd || player.dimension.id === MinecraftDimensionTypes.Nether)
    && player.location.y < 0
  ) {
    graveLocation = {
      ...player.location,
      y: 1,
    };
  }

  const grave = player.dimension.spawnEntity('akorozes:grave', graveLocation);
  grave.nameTag = player.nameTag;

  transferItems(player, grave);
  transferXp(player, grave);
  repositionGrave(grave);

  player.sendMessage({
    rawtext: [{
      translate: 'akorozes.graves.death_location',
      with: [grave.location.x.toFixed(2), grave.location.y.toFixed(2), grave.location.z.toFixed(2)],
    }],
  });
};

const transferItems = (player: Player, grave: Entity): void => {
  const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;
  const graveContainer: Container = (grave.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;
  const playerArmor: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

  const playerContainerSize = playerContainer?.size;
  if (playerContainer && graveContainer && playerContainerSize !== undefined) {
    // Transfer items from player inventory to grave
    for (let i = 0; i < playerContainerSize; i++) {
      playerContainer.moveItem(i, i, graveContainer);
    }

    // Transfer items from player equipment slots to grave
    // Note: equippement items are stored in
    // [playerContainerSize + 1, playerContainerSize + Object.entries(EquipmentSlot).lenght] slots of graveContainer
    let j = playerContainerSize;
    for (const value of Object.values(EquipmentSlot)) {
      j++;

      graveContainer.setItem(j, playerArmor.getEquipmentSlot(value).getItem());
      playerArmor.setEquipment(value, undefined);
    }

    playerContainer.clearAll();
  }
};

const transferXp = (player: Player, grave: Entity): void => {
  grave.setDynamicProperty('playerXp', player.getTotalXp());
  player.runCommand('xp -10000L');
};

const repositionGrave = (grave: Entity): void => {
  while (!grave.dimension.getBlock(grave.location)?.isAir) {
    grave.teleport({ ...grave.location, y: grave.location.y + 1 });
  }
};
