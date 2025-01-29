import { world, Block } from '@minecraft/server';
import { Vector3Utils } from '@minecraft/math';
import { LatestBlocksSettingsConfigVersion, ElevatorsSettings, ElevatorsBlocksSettings, ElevatorsBlocksSettingsDynamicProperties, ElevatorsBlockIndividualSettings, ElevatorsBlockIndividualSettingsIds } from '../Models';
import { getProperties, setProperties } from '../Util';
import { getSettings } from './settings';

/**
 * @name initializeBlocksSettings
 * @remarks Initializes the general addon blocks settings for elevators if they are not already initialized.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeBlocksSettings = (): void => {
	const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

	if (!elevatorsBlocksSettings.initialized) {
		const defaultElevatorsBlocksSettings: ElevatorsBlocksSettings = {
			configVersion: LatestBlocksSettingsConfigVersion,
			initialized: true,
			allBlockSettings: JSON.stringify([]),
		};

		setBlocksSettings(defaultElevatorsBlocksSettings);
	}
};

/**
 * @name getBlocksSettings
 * @remarks Retrieves the current addon blocks settings from the world properties.
 * @returns {ElevatorsBlocksSettings} The current blocks settings.
 */
export const getBlocksSettings = (): ElevatorsBlocksSettings => getProperties<ElevatorsBlocksSettings>(world, ElevatorsBlocksSettingsDynamicProperties);

/**
 * @name setBlocksSettings
 * @param {ElevatorsBlocksSettings} elevatorsBlocksSettings - The updated blocks settings to be saved.
 * @remarks Updates the addon blocks settings in the world properties.
 */
export const setBlocksSettings = (elevatorsBlocksSettings: ElevatorsBlocksSettings): void => {
	setProperties(world, ElevatorsBlocksSettingsDynamicProperties, elevatorsBlocksSettings);
};

/**
 * @name initializeElevatorBlockSettings
 * @param {Block} elevatorBlock - The elevator block to initialize the settings for.
 * @remarks Initializes the general block settings for an elevator block.
 * Sets default values for them and ensures required properties are set.
 */
export const initializeElevatorBlockSettings = (elevatorBlock: Block): void => {
	const elevatorsSettings: ElevatorsSettings = getSettings();
	const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

	// Make sure to delete redundant data
	deleteElevatorBlockSettings(elevatorBlock);

	elevatorsBlocksSettings.allBlockSettings = JSON.stringify(
		[
			...JSON.parse(elevatorsBlocksSettings.allBlockSettings),
			{
				[ElevatorsBlockIndividualSettingsIds.isConfigured]: false,
				[ElevatorsBlockIndividualSettingsIds.blockLocation]: elevatorBlock.location,
				[ElevatorsBlockIndividualSettingsIds.blockDimension]: elevatorBlock.dimension.id,
				[ElevatorsBlockIndividualSettingsIds.facingDirection]: elevatorsSettings.defaultFacingDirection,
				[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]: elevatorsSettings.elevatorsTickParticles,
				[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles]: undefined,
			} as ElevatorsBlockIndividualSettings,
		],
	);

	setBlocksSettings(elevatorsBlocksSettings);
};

/**
 * @name getElevatorBlockSettings
 * @param {Block} elevatorBlock - The elevator block which needs to get its block settings from.
 * @remarks Gets the elevator block settings.
 * @returns {ElevatorsBlockIndividualSettings | undefined} Returns the elevator block settings, otherwise returns undefined if the elevators blocks settings isn't initialized.
 */
export const getElevatorBlockSettings = (elevatorBlock: Block): ElevatorsBlockIndividualSettings | undefined => {
	const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

	if (!elevatorsBlocksSettings.initialized) return undefined;

	let elevatorBlockSettings: ElevatorsBlockIndividualSettings | undefined = (JSON.parse(elevatorsBlocksSettings.allBlockSettings) as ElevatorsBlockIndividualSettings[])
		.find((blockSettings: ElevatorsBlockIndividualSettings): boolean => Vector3Utils.equals(blockSettings[ElevatorsBlockIndividualSettingsIds.blockLocation], elevatorBlock.location) && blockSettings[ElevatorsBlockIndividualSettingsIds.blockDimension] === elevatorBlock.dimension.id);

	if (!elevatorBlockSettings) {
		initializeElevatorBlockSettings(elevatorBlock);

		elevatorBlockSettings = (JSON.parse(getBlocksSettings().allBlockSettings) as ElevatorsBlockIndividualSettings[])
			.find((blockSettings: ElevatorsBlockIndividualSettings): boolean => Vector3Utils.equals(blockSettings[ElevatorsBlockIndividualSettingsIds.blockLocation], elevatorBlock.location) && blockSettings[ElevatorsBlockIndividualSettingsIds.blockDimension] === elevatorBlock.dimension.id);
	}

	return elevatorBlockSettings;
};

/**
 * @name deleteElevatorBlockSettings
 * @param {Block} elevatorBlock - The elevator block which has to delete its block settings.
 * @remarks Deletes the elevator block settings.
 */
export const deleteElevatorBlockSettings = (elevatorBlock: Block): void => {
	// * Currently, if the elevator block is destroyed by any other means like setting the block to air by a command or an addon, then
	// * its block settings will not be deleted
	// * This cannot be fixed due to no way of listening to any kind of events that tells us that this block got disappeared due to other means mentioned above
	// * So, the dynamic properties will have redundant data of these blocks
	const elevatorsBlocksSettings: ElevatorsBlocksSettings = getBlocksSettings();

	elevatorsBlocksSettings.allBlockSettings = JSON.stringify(
		(JSON.parse(elevatorsBlocksSettings.allBlockSettings) as ElevatorsBlockIndividualSettings[])
			.filter((blockSettings: ElevatorsBlockIndividualSettings): boolean => !(Vector3Utils.equals(blockSettings[ElevatorsBlockIndividualSettingsIds.blockLocation], elevatorBlock.location) && blockSettings[ElevatorsBlockIndividualSettingsIds.blockDimension] === elevatorBlock.dimension.id)),
	);

	setBlocksSettings(elevatorsBlocksSettings);
};
