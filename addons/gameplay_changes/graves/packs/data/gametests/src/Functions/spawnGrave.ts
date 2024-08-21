import {
  Container,
  Entity,
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  Player,
  world
} from '@minecraft/server';
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data';
import { getSettings } from './settings';
import { GravesEntityTypes } from '../Models';
import { Grave, GraveDynamicProperties, GravesList, GravesListDynamicProperties } from '../Models/DynamicProperties';
import { getProperties, setProperties } from '../Util';

export const spawnGrave = (player: Player): void => {
  if (!isInventoryEmpty(player)) {
    const gravesSettings = getSettings();

    // Cannot spawn outside of world so need to check position before spawning, later we relocate depending
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

    const grave = player.dimension.spawnEntity(GravesEntityTypes.Grave, graveLocation);
    grave.nameTag = player.nameTag;

    transferItems(player, grave);
    setGraveProperties(player, grave);
    relocateGrave(grave);
    saveGraveToList(grave);

    if (gravesSettings.graveLocating) {
      player.sendMessage({
        rawtext: [{
          translate: 'bt.graves.location',
          with: [grave.location.x.toFixed(2), grave.location.y.toFixed(2), grave.location.z.toFixed(2), grave.dimension.id],
        }],
      });
    }
  }
};

// TODO ADD XP CHECK
const isInventoryEmpty = (player: Player): boolean => {
  const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
    ?.container as Container;
  const playerArmor: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

  let emptySlotsCount: number = playerContainer.emptySlotsCount;
  playerArmor.getEquipment(EquipmentSlot.Head) === undefined && emptySlotsCount++;
  playerArmor.getEquipment(EquipmentSlot.Chest) === undefined && emptySlotsCount++;
  playerArmor.getEquipment(EquipmentSlot.Legs) === undefined && emptySlotsCount++;
  playerArmor.getEquipment(EquipmentSlot.Feet) === undefined && emptySlotsCount++;
  playerArmor.getEquipment(EquipmentSlot.Offhand) === undefined && emptySlotsCount++;

  // Inventory + Armor + Offhand
  const totalSlotCount = playerContainer.size + 4 + 1;

  return emptySlotsCount === totalSlotCount;
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

const setGraveProperties = (player: Player, grave: Entity): void => {
  const graveProperties: Grave = {
    owner: player.name,
    playerExperience: player.getTotalXp(),
    spawnTime: world.getAbsoluteTime(),
  };

  setProperties(grave, GraveDynamicProperties, graveProperties);

  // Clear the player xp
  player.addExperience(-player.getTotalXp());
};

// TODO improve relocation
const relocateGrave = (grave: Entity): void => {
  while (!grave.dimension.getBlock(grave.location)?.isAir) {
    grave.teleport({ ...grave.location, y: grave.location.y + 1 });
  }
};

const saveGraveToList = (grave: Entity): void => {
  const gravesList = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

  gravesList.push(grave.id);

  setProperties(world, GravesListDynamicProperties, { list: JSON.stringify(gravesList) });
};
