import {
	Block,
	Container,
	Dimension,
	DimensionType,
	DimensionTypes,
	Entity,
	EntityComponentTypes,
	EntityEquippableComponent,
	EntityInventoryComponent,
	EquipmentSlot,
	ItemStack,
	Player,
	system,
	TicksPerSecond,
	Vector3,
	world
} from '@minecraft/server';
import { Grave, GraveDynamicProperties, GravesList, GravesListDynamicProperties, GravesSettings } from '../Models';
import { getProperties, setProperties } from '../Util';
import { getSettings } from './Settings';
import { clampNumber, Vector3Utils } from '@minecraft/math';
import { MinecraftBlockTypes, MinecraftDimensionTypes } from '@minecraft/vanilla-data';
import { GravesEntityTypes } from '../Models';

/**
 * Spawns a grave for a player, transferring their items and experience to the grave.
 *
 * @param {Player} player - The player whose items and experience will be stored in the grave.
 */
export const spawnGrave = (player: Player): void => {
	if (!isInventoryEmpty(player)) {
		const gravesSettings: GravesSettings = getSettings();

		// TODO if bottom of the world and empty below place on top of cobble slab
		// TODO After spawning tp grave 1 block up to be able to do above
		const graveLocation: Vector3 = calculateGraveLocation(player.location, player.dimension);

		// Spawn grave entity at the determined location
		const graveEntity: Entity = player.dimension.spawnEntity(GravesEntityTypes.Grave, graveLocation);

		graveEntity.nameTag = player.nameTag;

		// Transfer items to the grave and set its properties
		const itemCount: number = transferItemsToGrave(player, graveEntity);

		setGraveProperties(player, graveEntity, itemCount);

		// Notify player of grave location if enabled in settings
		if (gravesSettings.graveLocating) {
			player.sendMessage({
				rawtext: [{
					translate: 'bt.graves.location',
					with: [graveEntity.location.x.toString(), graveEntity.location.y.toString(), graveEntity.location.z.toString(), graveEntity.dimension.id],
				}],
			});
		}
	}
};

/**
 * Opens a grave for a player, transferring items and experience to the player,
 * and removing the grave from the world.
 *
 * @param {Player} player - The player attempting to open the grave.
 * @param {Entity} grave - The grave entity to be opened.
 */
export const openGrave = (player: Player, grave: Entity): void => {
	const gravesSettings: GravesSettings = getSettings();
	const graveProperties: Grave = getProperties(grave, GraveDynamicProperties);

	if (player.id === graveProperties.ownerId || gravesSettings.graveRobbing) {
		transferItemsToPlayer(player, grave);

		if (gravesSettings.xpCollection) {
			player.addExperience(graveProperties.playerExperience);
		}

		removeGraveFromList(grave);

		grave.remove();
	}
};

/**
 * Forcibly opens a grave, retrieving all items and removing the grave.
 *
 * @param {Entity} grave - The grave entity to be force-opened.
 */
export const forceOpenGrave = (grave: Entity): void => {
	getAllItems(grave);
	removeGraveFromList(grave);

	grave.remove();
};

/**
 * Checks all graves in all dimensions and removes those that have exceeded the despawn time.
 */
export const tickGrave = (): void => {
	const gravesSettings: GravesSettings = getSettings();

	if (gravesSettings.despawnTime > 0) {
		DimensionTypes.getAll().forEach((dimensionType: DimensionType): void => {
			const dimension: Dimension = world.getDimension(dimensionType.typeId);
			const currentDimensionGraves: Entity[] = dimension.getEntities({ type: GravesEntityTypes.Grave });

			currentDimensionGraves.forEach((grave: Entity): void => {
				const graveProperties: Grave = getProperties<Grave>(grave, GraveDynamicProperties);

				if ((system.currentTick - graveProperties.spawnTime) / TicksPerSecond > gravesSettings.despawnTime) {
					removeGraveFromList(grave);

					grave.remove();
				}
			});
		});
	}
};

/**
 * Transfers all items from a player's inventory and equipment slots to a grave.
 *
 * @param {Player} player - The player whose items will be transferred.
 * @param {Entity} grave - The grave entity that will store the items.
 * @returns {number} - The total number of items transferred.
 */
const transferItemsToGrave = (player: Player, grave: Entity): number => {
	let itemCount: number = 0;

	const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
		?.container as Container;
	const graveContainer: Container = (grave.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
		?.container as Container;
	const playerArmor: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

	const playerContainerSize: number = playerContainer?.size;
	if (playerContainer && graveContainer && playerContainerSize !== undefined) {
		// Transfer items from inventory
		for (let i: number = 0; i < playerContainerSize; i++) {
			const itemStack: ItemStack | undefined = playerContainer.getItem(i);
			if (itemStack) {
				itemCount += itemStack.amount;
			}

			playerContainer.moveItem(i, i, graveContainer);
		}

		// Transfer items from equipment slots
		let j: number = playerContainerSize;
		for (const value of Object.values(EquipmentSlot)) {
			j++;

			const itemStack: ItemStack | undefined = playerArmor.getEquipmentSlot(value).getItem();

			if (itemStack) {
				itemCount += itemStack.amount;
			}

			graveContainer.setItem(j, itemStack);
			playerArmor.setEquipment(value, undefined);
		}

		// Clear remaining inventory
		playerContainer.clearAll();
	}

	return itemCount;
};

/**
 * Transfers items from a grave to a player's inventory or drops items
 * that cannot be stored in the player's inventory.
 *
 * @param {Player} player - The player receiving the items.
 * @param {Entity} grave - The grave containing items to be transferred.
 */
const transferItemsToPlayer = (player: Player, grave: Entity): void => {
	const playerContainer: Container = (player.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
		?.container as Container;
	const graveContainer: Container = (grave.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
		?.container as Container;
	const playerArmor: EntityEquippableComponent = player.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

	const playerContainerSize: number = playerContainer?.size;

	if (playerContainer && graveContainer && playerContainerSize !== undefined) {
		const itemsToSpawn: ItemStack[] = [];

		// Transfer items from grave to player inventory
		for (let i: number = 0; i < playerContainerSize; i++) {
			if (!playerContainer.getSlot(i).hasItem()) {
				graveContainer.moveItem(i, i, playerContainer);
			} else {
				const slotItem: ItemStack | undefined = graveContainer.getItem(i);

				if (slotItem) {
					itemsToSpawn.push(playerContainer.getSlot(i).getItem() as ItemStack);
					graveContainer.moveItem(i, i, playerContainer);
				}
			}
		}

		// Transfer items from grave to player equipment slots
		let j = playerContainerSize;
		for (const value of Object.values(EquipmentSlot)) {
			j++;

			const slotItem: ItemStack | undefined = graveContainer.getItem(j);

			if (!playerArmor.getEquipmentSlot(value).hasItem()) {
				playerArmor.getEquipmentSlot(value).setItem(slotItem);
			} else {
				if (slotItem) {
					itemsToSpawn.push(playerArmor.getEquipmentSlot(value).getItem() as ItemStack);
					playerArmor.getEquipmentSlot(value).setItem(slotItem);
				}
			}
		}

		spawnItemsInWorld(grave, itemsToSpawn);
	}
};

/**
 * Retrieves all items from a grave and spawns them in the world.
 *
 * @param {Entity} grave - The grave containing items.
 */
const getAllItems = (grave: Entity): void => {
	const graveContainer: Container = (grave.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent)
		?.container as Container;

	const containerSize: number = graveContainer?.size;

	const itemsToSpawn: ItemStack[] = [];

	for (let i: number = 0; i < containerSize; i++) {
		const item: ItemStack | undefined = graveContainer.getSlot(i).getItem();

		if (item) {
			itemsToSpawn.push(item);
		}
	}

	spawnItemsInWorld(grave, itemsToSpawn);
};

/**
 * Spawns items in the world at the grave's location.
 *
 * @param {Entity} grave - The grave entity where items should spawn.
 * @param {ItemStack[]} itemsToSpawn - List of items to be spawned in the world.
 */
const spawnItemsInWorld = (grave: Entity, itemsToSpawn: ItemStack[]): void => {
	itemsToSpawn.forEach((item: ItemStack): void => {
		grave.dimension.spawnItem(item, grave.location);
	});
};

/**
 * Checks if the player's inventory, armor, and offhand slots are empty.
 *
 * @param {Player} player - The player whose inventory will be checked.
 * @returns {boolean} - Returns true if all slots are empty; false otherwise.
 */
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

	// Total slots include inventory, armor, and offhand
	const totalSlotCount: number = playerContainer.size + 4 + 1;

	return emptySlotsCount === totalSlotCount;
};

/**
 * Sets the properties of a grave, such as owner, experience, and item count.
 *
 * @param {Player} player - The player whose grave is being created.
 * @param {Entity} grave - The grave entity to set properties on.
 * @param {number} itemCount - The total number of items in the grave.
 */
const setGraveProperties = (player: Player, grave: Entity, itemCount: number): void => {
	const graveProperties: Grave = {
		id: grave.id,
		ownerId: player.id,
		ownerName: player.nameTag,
		playerExperience: player.getTotalXp(),
		spawnTime: system.currentTick,
		location: grave.location,
		dimension: grave.dimension.id as MinecraftDimensionTypes,
		itemCount,
	};

	setProperties(grave, GraveDynamicProperties, graveProperties);

	// Clear player experience (min bound)
	player.addLevels(-(2 ** 24));

	saveGraveToList(graveProperties);
};

/**
 * Calculates a valid grave spawning location.
 *
 * @param {Vector3} initialLocation - The starting location for the grave.
 * @param {Dimension} dimension - The spawning dimension of the grave.
 *
 * @returns {Vector3} - A valid grave location.
 */
const calculateGraveLocation = (initialLocation: Vector3, dimension: Dimension): Vector3 => {
	// Define spawning limits
	const minLimit: Vector3 = Vector3Utils.floor({
		x: initialLocation.x - 1,
		y: dimension.heightRange.min,
		z: initialLocation.z - 1,
	});
	const maxLimit: Vector3 = Vector3Utils.floor({
		x: initialLocation.x + 1,
		y: dimension.heightRange.max,
		z: initialLocation.z + 1,
	});

	if (!isValidSpawnBlock(initialLocation, dimension)) {
		for (let y: number = minLimit.y; y <= maxLimit.y; y++) {
			for (let x: number = minLimit.x; x <= maxLimit.x; x++) {
				for (let z: number = minLimit.z; z <= maxLimit.z; z++) {
					if (isValidSpawnBlock({ x, y, z }, dimension)) {
						return { x, y, z };
					}
				}
			}
		}
	}

	// If initialLocation is valid or no other valid location found, return the initial location clamped to world limits
	return Vector3Utils.floor({ ...initialLocation, y: clampNumber(initialLocation.y, dimension.heightRange.min, dimension.heightRange.max) });
};

/**
 * Determines whether the block at a given location within a dimension is valid for spawning a grave.
 *
 * A valid spawn block is one that matches any of the types specified in the `validBlocks` array.
 * This should include any "pass-through" blocks (like Air, Water, TallGrass, Flowers, Kelp, Bubbles, etc.).
 *
 * @param {Vector3} location - The location of the block to validate.
 * @param {Dimension} dimension - The dimension in which to check the block.
 *
 * @returns {boolean} - If the block at the specified location is valid for spawning a grave
 *
 *
 * Note: using {"@minecraft/server": "1.16.0"} we cannot check if a block is "pass-through"
 * Needs to be updated when it will possible, so it can also be compatible with Addon blocks
 */
const isValidSpawnBlock = (location: Vector3, dimension: Dimension): boolean => {
	const validBlocks: MinecraftBlockTypes[] = [
		MinecraftBlockTypes.Air,
		MinecraftBlockTypes.Water,
		// TODO add "pass-through" blocks like tall grass, flowers, kelp...
		// TODO check flowing_water
	];

	const block: Block | undefined = dimension.getBlock(location);

	if (!block) {
		return false;
	}

	return validBlocks.some((validBlockType: MinecraftBlockTypes): boolean => block.matches(validBlockType));
};

/**
 * Saves a grave's properties to the global graves list.
 *
 * @param {Grave} grave - The grave properties to be added to the list.
 */
const saveGraveToList = (grave: Grave): void => {
	const gravesList: Grave[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

	gravesList.push(grave);

	setProperties(world, GravesListDynamicProperties, { list: JSON.stringify(gravesList) });
};

/**
 * Removes a grave entity from the global list of graves.
 *
 * @param {Entity} grave - The grave entity to be removed.
 */
const removeGraveFromList = (grave: Entity): void => {
	const gravesList: Grave[] = JSON.parse(getProperties<GravesList>(world, GravesListDynamicProperties).list);

	const filteredGraves: Grave[] = gravesList.filter((g: Grave): boolean => g.id !== grave.id);

	setProperties(world, GravesListDynamicProperties, { list: JSON.stringify(filteredGraves) });
};
