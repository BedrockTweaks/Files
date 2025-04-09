import { system, Entity, ItemStack, Block } from '@minecraft/server';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';

/**
 * @name convertToMud
 * @param {Entity} dirtItemEntity - The dropped dirt variant item entity to convert to the mud item.
 * @param {ItemStack} dirtItem - The dropped dirt variant item as the ItemStack to convert to the mud item.
 * @remarks Converts the dirt variant item to the mud item by making sure it is dropped inside the middle of the cauldron block.
 *
 * This function can't be called in read-only mode.
 */
export const convertToMud = (dirtItemEntity: Entity, dirtItem: ItemStack): void => {
	let ticksOnCauldron: number = 0;

	const mudConvertRunId: number = system.runInterval((): void => {
		if (!dirtItemEntity.isValid()) {
			system.clearRun(mudConvertRunId);

			return;
		}

		if (dirtItemEntity.getVelocity().y === 0) {
			const { dimension: dirtItemEntityDimension } = dirtItemEntity;

			const block: Block | undefined = dirtItemEntityDimension.getBlock(dirtItemEntity.location);

			// If the chunk in which the dirtItem is dropped is unloaded, then stop the further execution
			if (!block) {
				system.clearRun(mudConvertRunId);

				return;
			}

			const belowBlock: Block = block.below()!;

			// This prevents false positives
			if (belowBlock.isAir) return;

			// This prevents cases when the dirtItem is on top of the cauldron block for few moments until going inside are not considered
			if (belowBlock.typeId === MinecraftBlockTypes.Cauldron) {
				// If the dirtItem is still on top of the cauldron block for more than 10 ticks, then stop the further execution
				if (ticksOnCauldron > 10) {
					system.clearRun(mudConvertRunId);
				} else {
					ticksOnCauldron++;
				}

				return;
			}

			system.clearRun(mudConvertRunId);

			if (block.typeId === MinecraftBlockTypes.Cauldron) {
				const { permutation } = block;

				if ((permutation.getState('cauldron_liquid') as string) === 'water' && (permutation.getState('fill_level') as number) >= 1) {
					dirtItemEntity.remove();

					dirtItemEntityDimension.spawnItem(new ItemStack(MinecraftBlockTypes.Mud, dirtItem.amount), block.center());
				}
			}
		}
	}, 1);
};
