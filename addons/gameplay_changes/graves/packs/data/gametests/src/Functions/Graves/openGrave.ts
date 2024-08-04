import {
  Container,
  Entity,
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemStack,
  Player
} from '@minecraft/server';

export const openGrave = (player: Player, grave: Entity): void => {
  if (player.nameTag === grave.nameTag) {
    transferItems(player, grave);
    transferXp(player, grave);

    grave.triggerEvent('despawn');
  }
};

const transferItems = (player: Player, grave: Entity): void => {
  const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;
  const graveContainer: Container = (grave.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;
  const playerArmor: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

  const playerContainerSize = playerContainer?.size;

  if (playerContainer && graveContainer && playerContainerSize !== undefined) {
    const itemsToSpawn: ItemStack[] = [];

    // Transfer items from grave to player inventory
    for (let i = 0; i < playerContainerSize; i++) {
      if (!playerContainer.getSlot(i).hasItem()) {
        graveContainer.moveItem(i, i, playerContainer);
      } else {
        const slotItem = graveContainer.getItem(i);

        if (slotItem) {
          itemsToSpawn.push(slotItem);
        }
      }
    }

    // Transfer items from grave to player equipment slots
    // Note: equipment items are stored in
    // [playerContainerSize + 1, playerContainerSize + Object.entries(EquipmentSlot).length] slots of graveContainer
    let j = playerContainerSize;
    for (const value of Object.values(EquipmentSlot)) {
      j++;

      const slotItem = graveContainer.getItem(j);

      if (!playerArmor.getEquipmentSlot(value).hasItem()) {
        playerArmor.getEquipmentSlot(value).setItem(slotItem);
      } else {
        if (slotItem) {
          itemsToSpawn.push(slotItem);
        }
      }
    }

    spawnItemsInWorld(grave, itemsToSpawn);
  }
};

const spawnItemsInWorld = (grave: Entity, itemsToSpawn: ItemStack[]): void => {
  itemsToSpawn.forEach((item: ItemStack): void => {
    grave.dimension.spawnItem(item, grave.location);
  });
};

const transferXp = (player: Player, grave: Entity): void => {
  player.addExperience(grave.getDynamicProperty('playerXp') as number);
};
