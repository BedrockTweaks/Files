import { system, BlockPermutation, Dimension, Block, Vector3, Entity, Player, ItemStack, TeleportOptions, Vector2 } from '@minecraft/server';
import { Vector3Builder, Vector3Utils } from '@minecraft/math';
import { Elevators, ElevatorsDynamicProperties, ElevatorsSettings, ElevatorsBlockIndividualSettings, ElevatorsBlockIndividualSettingsIds, ElevatorsSounds, ElevatorsParticles, ElevatorBlockTypes, WoolBlockTypes, ElevatorTickParticleMolang, WoolToElevatorParticleMolang, VanillaFullBlocksList, ElevatorsBlockStates, IllegalFullBlocksList } from '../Models';
import { getProperties, setProperties } from '../Util';
import { getSettings } from './settings';
import { initializeElevatorBlockSettings, getElevatorBlockSettings } from './blocksSettings';

/**
 * @name startElevatorTeleport
 * @param {Player} player - The player who is on top of the elevator block.
 * @param {Dimension} dimension - The dimension in which the player is currently in.
 * @param {Block} elevatorBlock - The elevator block on which the player is currently standing.
 * @remarks Starts the elevator teleport process when the player is standing on top of an elevator block.
 *
 * This function can't be called in read-only mode.
 */
export const startElevatorTeleport = (player: Player, dimension: Dimension, elevatorBlock: Block): void => {
	const { max: dimensionMaxHeight, min: dimensionMinHeight } = dimension.heightRange;
	const { typeId: elevatorBlockTypeId, location: elevatorBlockLocation } = elevatorBlock;

	const elevatorBlockAboveY: number = elevatorBlockLocation.y + 1;
	const elevatorBlockBelowY: number = elevatorBlockLocation.y - 1;

	const cannotCheckAboveDistance: boolean = dimensionMaxHeight - elevatorBlockAboveY <= 0;
	const cannotCheckBelowDistance: boolean = elevatorBlockBelowY - dimensionMinHeight <= 0;

	let startTick: number = system.currentTick;

	const elevatorTeleportRunId: number = system.runInterval((): void => {
		if (!player.isValid()) {
			system.clearRun(elevatorTeleportRunId);

			return;
		}

		if (system.currentTick - startTick >= 200) {
			const checkElevatorBlockBelow: Block | undefined = isElevatorBlockBelow(dimension, player.location);

			// If the player is somehow no longer on top of the same elevator block while in the process of elevator teleport, then clear this system run
			if (!checkElevatorBlockBelow || checkElevatorBlockBelow.typeId !== elevatorBlockTypeId || !Vector3Utils.equals(checkElevatorBlockBelow.location, elevatorBlockLocation)) {
				clearElevatorsTeleportSystemRun(player, elevatorTeleportRunId);

				return;
			} else {
				startTick = system.currentTick;
			}
		}

		if (player.isJumping) {
			if (cannotCheckAboveDistance) return;

			for (let checkElevatorBlockAboveY: number = elevatorBlockAboveY; checkElevatorBlockAboveY < dimensionMaxHeight; checkElevatorBlockAboveY++) {
				if (!player.isValid()) break;

				const aboveBlock: Block | undefined = dimension.getBlock({ x: elevatorBlockLocation.x, y: checkElevatorBlockAboveY, z: elevatorBlockLocation.z });

				if (!aboveBlock) break;

				if (aboveBlock.typeId === elevatorBlockTypeId) {
					teleportToElevator(player, dimension, elevatorTeleportRunId, aboveBlock);

					break;
				}
			}
		} else if (player.isSneaking) {
			if (cannotCheckBelowDistance) return;

			for (let checkElevatorBlockBelowY: number = elevatorBlockBelowY; checkElevatorBlockBelowY >= dimensionMinHeight; checkElevatorBlockBelowY--) {
				if (!player.isValid()) break;

				const belowBlock: Block | undefined = dimension.getBlock({ x: elevatorBlockLocation.x, y: checkElevatorBlockBelowY, z: elevatorBlockLocation.z });

				if (!belowBlock) break;

				if (belowBlock.typeId === elevatorBlockTypeId) {
					teleportToElevator(player, dimension, elevatorTeleportRunId, belowBlock);

					break;
				}
			}
		}
	}, 1);

	setProperties(player, ElevatorsDynamicProperties, { teleportSystemRunId: elevatorTeleportRunId } as Elevators);
};

/**
 * @name stopElevatorTeleport
 * @param {Player} player - The player who stepped off the elevator block.
 * @remarks Stops the elevator teleport process when the player is no longer on top of the elevator block.
 */
export const stopElevatorTeleport = (player: Player): void => {
	const runId: number | undefined = getProperties<Elevators>(player, ElevatorsDynamicProperties).teleportSystemRunId;

	if (runId) {
		clearElevatorsTeleportSystemRun(player, runId);
	}
};

/**
 * @name teleportToElevator
 * @param {Player} player - The player who needs to be teleported on top of the elevator block.
 * @param {Dimension} dimension - The dimension in which the player needs to be teleported.
 * @param {number} elevatorTeleportRunId - The system run identifier which needs to be cleared for no further execution in startElevatorTeleport function.
 * @param {Block} elevatorBlock - The elevator block which the player is to be teleported on top of it.
 * @remarks Teleports the player on top of the elevator block.
 *
 * This function can't be called in read-only mode.
 */
export const teleportToElevator = (player: Player, dimension: Dimension, elevatorTeleportRunId: number, elevatorBlock: Block): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();
	const elevatorBlockSettings: ElevatorsBlockIndividualSettings | undefined = getElevatorBlockSettings(elevatorBlock);

	if (!elevatorBlockSettings) return;

	const elevatorBlockAbove: Block = elevatorBlock.above()!;

	if (elevatorsSettings.safeTeleport) {
		if (!elevatorBlockAbove.isAir) {
			player.sendMessage({ translate: 'bt.elevators.teleport.not_safe_location' });

			return;
		}
	}

	if (elevatorsSettings.xpLevelsUse > 0) {
		if (player.level < elevatorsSettings.xpLevelsUse) {
			player.sendMessage({ translate: 'bt.elevators.teleport.insufficient_xp_levels', with: [`${elevatorsSettings.xpLevelsUse}`, `${elevatorsSettings.xpLevelsUse !== 1 ? 'levels' : 'level'}`] });

			return;
		}

		player.addLevels(-1 * elevatorsSettings.xpLevelsUse);
	}

	clearElevatorsTeleportSystemRun(player, elevatorTeleportRunId);

	const { location: playerLocation } = player;

	dimension.playSound(ElevatorsSounds.playerTeleport, playerLocation, { volume: ElevatorsSounds.playerTeleportVolume as number, pitch: ElevatorsSounds.playerTeleportPitch as number });

	const teleportOptions: TeleportOptions = {
		// We use rotation instead of facingDirection because it doesn't work for some reasons
		...elevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.facingDirection] !== 'none' ? { rotation: getRotationalDirection(elevatorBlockSettings[ElevatorsBlockIndividualSettingsIds.facingDirection]) } : {},
	};

	player.teleport(elevatorBlockAbove.center(), teleportOptions);

	// This make sure that the teleport sound is only played when the player is teleported
	const playerFloorLocation: Vector3 = Vector3Utils.floor(playerLocation);
	const playSoundRunId: number = system.runInterval((): void => {
		if (!player.isValid()) {
			system.clearRun(playSoundRunId);

			return;
		}

		const { location: newPlayerLocation } = player;

		if (!Vector3Utils.equals(playerFloorLocation, Vector3Utils.floor(newPlayerLocation))) {
			dimension.playSound(ElevatorsSounds.playerTeleport, newPlayerLocation, { volume: ElevatorsSounds.playerTeleportVolume as number, pitch: ElevatorsSounds.playerTeleportPitch as number });

			system.clearRun(playSoundRunId);
		}
	}, 1);
};

/**
 * @name isElevatorBlockBelow
 * @param {Dimension} dimension - The dimension which is provided.
 * @param {Vector3} location - The location which is provided.
 * @remarks Checks if the block below the location is an elevator block or not.
 * @returns {Block | undefined} If the block below the location is an elevator block, returns the elevator block, otherwise returns undefined.
 */
export const isElevatorBlockBelow = (dimension: Dimension, location: Vector3): Block | undefined => {
	const checkElevatorBlockBelow: Block | undefined = dimension.getBlock(new Vector3Builder(location).floor().subtract({ x: 0, y: 1, z: 0 }));

	return checkElevatorBlockBelow && ElevatorBlockTypes.includes(checkElevatorBlockBelow.typeId) ? checkElevatorBlockBelow : undefined;
};

/**
 * @name clearElevatorsTeleportSystemRun
 * @param {Player} player - The player whose elevator teleport run identifier needs to be cleared for.
 * @param {number} elevatorTeleportRunId - The system run identifier which needs to be cleared for no further execution in startElevatorTeleport function.
 * @remarks Clears the system run in startElevatorTeleport function and also clears the elevators teleport run identifier from the player.
 */
export const clearElevatorsTeleportSystemRun = (player: Player, elevatorTeleportRunId: number): void => {
	system.clearRun(elevatorTeleportRunId);
	setProperties(player, ElevatorsDynamicProperties, { teleportSystemRunId: undefined } as Elevators);
};

/**
 * @name tickElevatorParticles
 * @param {Vector3} elevatorBlockLocation - The location of elevator block on which the particle needs to be spawned on top of.
 * @param {Dimension} elevatorDimension - The dimension in which elevator block is situated in.
 * @remarks Spawns particles on top of the elevator block on every 10 ticks.
 *
 * This function can't be called in read-only mode.
 * @throws {Error} If the error isn't LocationInUnloadedChunkError type.
 */
export const tickElevatorParticles = (elevatorBlockLocation: Vector3, elevatorDimension: Dimension): void => {
	// During dimension change, LocationInUnloadedChunkError may be thrown sometimes
	try {
		elevatorDimension.spawnParticle(ElevatorsParticles.elevatorTick, Vector3Utils.add(elevatorBlockLocation, { x: 0, y: 1, z: 0 }), ElevatorTickParticleMolang);
	} catch (error) {
		if (!(error instanceof Error)) throw error;

		if (!error.message.includes('LocationInUnloadedChunkError')) throw error;
	}
};

/**
 * @name woolToElevator
 * @param {Entity} enderPearlItemEntity - The ender pearl item entity which is dropped.
 * @remarks Checks if the ender pearl item is dropped on top of a wool block.
 * If it is a wool block, then convert the wool block to an elevator block of the same wool color.
 *
 * This function can't be called in read-only mode.
 */
export const woolToElevator = (enderPearlItemEntity: Entity): void => {
	const woolToElevatorRunId: number = system.runInterval((): void => {
		if (!enderPearlItemEntity.isValid()) {
			system.clearRun(woolToElevatorRunId);

			return;
		}

		if (enderPearlItemEntity.getVelocity().y === 0) {
			const { dimension: enderPearlItemDimension } = enderPearlItemEntity;

			const block: Block | undefined = enderPearlItemDimension.getBlock(enderPearlItemEntity.location)?.below();

			// If the chunk in which the ender pearl item is dropped is unloaded, then stop the further execution
			if (!block) {
				system.clearRun(woolToElevatorRunId);

				return;
			}

			// This prevents false positives
			if (block.isAir) return;

			system.clearRun(woolToElevatorRunId);

			const { typeId: blockTypeId } = block;

			if (WoolBlockTypes.includes(blockTypeId)) {
				enderPearlItemEntity.remove();

				const { location: blockLocation } = block;

				block.setType(`bt:e.${blockTypeId.replace(/minecraft:|_wool/g, '')}_elevator`);

				const blockInMiddleLocation: Vector3 = Vector3Utils.add(blockLocation, { x: 0.5, y: 0.5, z: 0.5 });

				enderPearlItemDimension.spawnParticle(ElevatorsParticles.woolToElevatorNorthSouth, blockInMiddleLocation, WoolToElevatorParticleMolang);
				enderPearlItemDimension.spawnParticle(ElevatorsParticles.woolToElevatorEastWest, blockInMiddleLocation, WoolToElevatorParticleMolang);

				initializeElevatorBlockSettings(block);

				for (const player of enderPearlItemDimension.getPlayers({ location: blockLocation, minDistance: 0, maxDistance: 2 })) {
					const checkElevatorBlockBelow: Block | undefined = isElevatorBlockBelow(enderPearlItemDimension, player.location);

					if (checkElevatorBlockBelow && Vector3Utils.equals(checkElevatorBlockBelow.location, blockLocation)) {
						startElevatorTeleport(player, enderPearlItemDimension, block);
					}
				}
			}
		}
	}, 1);
};

/**
 * @name stopNearbyPlayersElevatorTeleport
 * @param {Dimension} elevatorDimension - The dimension in which the provided elevator block is situated in.
 * @param {string} elevatorBlockTypeId - The type id of the elevator block which is provided.
 * @param {Vector3} elevatorBlockLocation - The location of the elevator block which is provided.
 * @remarks Stops the elevator teleport for all the nearby players who are standing on top of the provided elevator block.
 */
export const stopNearbyPlayersElevatorTeleport = (elevatorDimension: Dimension, elevatorBlockTypeId: string, elevatorBlockLocation: Vector3): void => {
	for (const nearbyPlayer of elevatorDimension.getPlayers({ location: elevatorBlockLocation, minDistance: 0, maxDistance: 10 })) {
		const checkElevatorBlockBelow: Block | undefined = isElevatorBlockBelow(elevatorDimension, nearbyPlayer.location);

		if (checkElevatorBlockBelow && checkElevatorBlockBelow.typeId === elevatorBlockTypeId && Vector3Utils.equals(checkElevatorBlockBelow.location, elevatorBlockLocation)) {
			stopElevatorTeleport(nearbyPlayer);
		}
	}
};

/**
 * @name camouflageElevator
 * @param {Player} player - The player who wants to camouflage the elevator.
 * @param {Block} elevatorBlock - The elevator block which has to be camouflaged.
 * @param {ItemStack} item - The item which is used to camouflage the elevator into that item only if it is a full block and not an illegal full block.
 * @remarks Camouflages the elevator into the item which is used on it.
 *
 * This function can't be called in read-only mode.
 */
export const camouflageElevator = (player: Player, elevatorBlock: Block, item: ItemStack): void => {
	// TODO: Fix elevator camouflage for grass block top having grayscale texture instead of colored texture

	const { typeId: itemTypeId } = item;

	if (IllegalFullBlocksList.includes(itemTypeId)) {
		player.sendMessage({ translate: 'bt.elevators.camouflage.illegal_full_blocks' });

		return;
	}

	if (!VanillaFullBlocksList.includes(itemTypeId)) {
		player.sendMessage({ translate: 'bt.elevators.camouflage.item_cannot_be_used', with: [(itemTypeId.startsWith('minecraft:') ? itemTypeId.replace(/minecraft:/g, '').split('_').map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join(' ') : null) ?? (itemTypeId.startsWith('bt:') ? itemTypeId.substring(itemTypeId.indexOf('.') + 1).split('_').map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join(' ') : itemTypeId)] });

		return;
	}

	const bitStates: Record<string, boolean> = getCamouflageBitStates(VanillaFullBlocksList.indexOf(itemTypeId));

	elevatorBlock.setPermutation(BlockPermutation.resolve(elevatorBlock.typeId, bitStates));
};

/**
 * @name getCamouflageBitStates
 * @param {number} fullBlockIndex - The index of the full block from the VanillaFullBlocksList array.
 * @remarks Converts the full block index to base 2 binary bits block states.
 * @returns {Record<string, boolean>} Returns an object consisting of all the block states binary bits as keys with boolean as values.
 */
export const getCamouflageBitStates = (fullBlockIndex: number): Record<string, boolean> => {
	const maxBits: number = Math.ceil(Math.log2(VanillaFullBlocksList.length));

	const binaryFullBlockIndex: string = fullBlockIndex.toString(2).padStart(maxBits, '0');

	const bitStates: Record<string, boolean> = {};

	binaryFullBlockIndex.split('').forEach((bit: string, bitIndex: number): void => {
		bitStates[`${ElevatorsBlockStates.camouflageBit}${bitIndex + 1}`] = bit === '1';
	});

	return bitStates;
};

/**
 * @name getRotationalDirection
 * @param {string} direction - The direction to use to get its rotational vector2.
 * @remarks Gets the rotational vector2 based on the direction provided.
 * @returns {Vector2} Returns the rotational vector2.
 * @throws {Error} If the direction string is invalid.
 */
export const getRotationalDirection = (direction: string): Vector2 => {
	switch (direction) {
		case 'north':
			return { x: 0, y: 180 };
		case 'south':
			return { x: 0, y: 0 };
		case 'east':
			return { x: 0, y: -90 };
		case 'west':
			return { x: 0, y: 90 };
		default:
			throw new Error('Invalid direction string provided.');
	}
};
