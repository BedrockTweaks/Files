import {
	EntityDamageSource,
	Entity,
	EntityComponentTypes,
	EntityEquippableComponent,
	EquipmentSlot,
	ItemStack,
	ItemComponentTypes,
	ItemEnchantableComponent,
	ContainerSlot,
	Enchantment
} from '@minecraft/server';
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';
import { HusksDropSandForbiddenDeaths, HusksDropSandSettings } from '../Models';
import { getSettings } from './settings';

export const checkEntities = (deadEntity: Entity, { damagingEntity, cause }: EntityDamageSource): void => {
	// * allows us to neatly block any death causes that should not drop items.
	if (cause in HusksDropSandForbiddenDeaths) return;

	if (!damagingEntity) {
		void dropLootItem(MinecraftItemTypes.Sand, 0, deadEntity);

		return;
	}

	if (!damagingEntity?.hasComponent(EntityComponentTypes.Equippable)) return;
	const playerEquipment = damagingEntity?.getComponent(EntityComponentTypes.Equippable) as EntityEquippableComponent;

	const itemSlot = playerEquipment.getEquipmentSlot(EquipmentSlot.Mainhand);

	const enchantment = getEnchantment(MinecraftEnchantmentTypes.Looting, itemSlot);
	const looting: number = enchantment ? enchantment.level : 0;

	void dropLootItem(MinecraftItemTypes.Sand, looting, deadEntity);
};

/**
 * Takes in a given itemSlot and checks if the given enchantment exists on that item and returns it, returns undefined if not.
 *
 * @param {Enchantment} enchantment - The enchantment you want to get from the item.
 * @param {ContainerSlot} itemSlot - The item you want to search for a specific enchantment.
 * @returns Returns the provided Enchantment or undefined.
 */
export const getEnchantment = (enchantment: string, itemSlot: ContainerSlot): Enchantment | undefined => {
	const heldItem = itemSlot.getItem() as ItemStack;
	if (heldItem.hasComponent(ItemComponentTypes.Enchantable)) {
		const itemEnchantments = heldItem.getComponent(ItemComponentTypes.Enchantable) as ItemEnchantableComponent;
		if (itemEnchantments.hasEnchantment(enchantment)) {
			return itemEnchantments.getEnchantment(enchantment) as Enchantment;
		}
	}

	return undefined;
};

/**
 * Takes in an item, the lootingLevel of the weapon that killed the entity and the dead entity
 * and spawns the item at the dead entities feet.
 *
 * @param {string} item - The item to drop on the ground.
 * @param {number} lootingLevel - The number of levels of looting that should be applied to the dropped item.
 * @param {Entity} entity - The entity that should drop the item.
 */
export const dropLootItem = (item: string, lootingLevel: number, entity: Entity): void => {
	const settings: HusksDropSandSettings = getSettings();

	/**
	 * * Math Explaination
	 * (settings.sandMax - settings.sandMin + 1) + settings.sandMin)	=> this lets us set an upper and lower bounds dynamically
	 * Math.floor(Math.random() * {result})								=> randomly picks a value in the middle of that range from min to max
	 * Math.floor(Math.random() * (lootingLevel + 1))					=> adds a random amount between 0 and the level of looting enchantment on the held tool
	 */
	const amount: number = Math.floor(Math.random() * (settings.sandMax - settings.sandMin + 1) + settings.sandMin) + Math.floor(Math.random() * (lootingLevel + 1));
	const dropChance: number = 0.33 - 0.01 * lootingLevel;
	if (Math.random() > dropChance) {
		entity.dimension.spawnItem(new ItemStack(item, amount), entity.location);
	}
};
