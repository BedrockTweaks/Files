import {
	system,
	Block,
	ContainerSlot,
	ItemStack,
	ItemComponentTypes,
	ItemEnchantableComponent,
	Enchantment
} from '@minecraft/server';
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';

export const dropItem = async(block: Block, itemStack: ItemStack): Promise<void> => {
	const silkTouch = getEnchantment(MinecraftEnchantmentTypes.SilkTouch, itemStack);
	if (!silkTouch) return;
	await system.waitTicks(1);
	block.dimension.spawnItem(new ItemStack(MinecraftItemTypes.BuddingAmethyst, 1), block.center());
};

/**
 * Takes in a given itemSlot and checks if the given enchantment exists on that item and returns it, returns undefined if not.
 *
 * @param {Enchantment} enchantment - The enchantment you want to get from the item.
 * @param {ContainerSlot | ItemStack} item - The itemStack or an slot containing an itemStack you want to check for an enchantment.
 * @returns Returns the provided Enchantment or undefined.
 */
export const getEnchantment = (enchantment: string, item: ContainerSlot | ItemStack): Enchantment | undefined => {
	if (item instanceof ContainerSlot) {
		item = item.getItem() as ItemStack;
	}
	if (item.hasComponent(ItemComponentTypes.Enchantable)) {
		const itemEnchantments = item.getComponent(ItemComponentTypes.Enchantable) as ItemEnchantableComponent;
		if (itemEnchantments.hasEnchantment(enchantment)) {
			return itemEnchantments.getEnchantment(enchantment) as Enchantment;
		}
	}

	return undefined;
};
