import { Vector3 } from '@minecraft/server';

export enum ElevatorsSettingsDynamicProperties {
	configVersion = 'bt:e.settings_config_version',
	initialized = 'bt:e.settings_initialized',
	defaultFacingDirection = 'bt:e.settings_default_facing_direction',
	elevatorsTickParticles = 'bt:e.settings_elevators_tick_particles',
	sameColorTeleport = 'bt:e.settings_same_color_teleport',
	safeTeleport = 'bt:e.settings_safe_teleport',
	camouflage = 'bt:e.settings_camouflage',
	xpLevelsUse = 'bt:e.settings_xp_levels_use'
}

export interface ElevatorsSettings {
	// The config version which is currently being used
	configVersion: number;
	// Indicates whether the elevators system settings have been initialized
	initialized: boolean;
	// Change the default facing direction the elevator teleports the player, so they face that direction upon teleportation
	defaultFacingDirection: string;
	// Controls whether the elevators will tick particles on top of it or not
	elevatorsTickParticles: boolean;
	// Controls whether the elevator block above or below must be the same color of the elevator block which the player is standing on to teleport between them
	sameColorTeleport: boolean;
	// Controls whether the elevators will safely teleport the player by making sure there is no obstructions of blocks on top of the destination elevator block
	safeTeleport: boolean;
	// Controls whether the elevators can be camouflaged by solid blocks or not
	camouflage: boolean;
	// The amount of XP levels to be consumed when using the elevator to teleport
	xpLevelsUse: number;
}

export enum ElevatorsBlocksSettingsDynamicProperties {
	configVersion = 'bt:e.blocks_settings_config_version',
	initialized = 'bt:e.blocks_settings_initialized',
	allBlockSettings = 'bt:e.blocks_settings_all_block_settings'
}

export interface ElevatorsBlocksSettings {
	// The config version which is currently being used
	configVersion: number;
	// Indicates whether the elevators blocks settings have been initialized
	initialized: boolean;
	// All the block settings of all the elevator blocks
	allBlockSettings: string;
}

export enum ElevatorsBlockIndividualSettingsIds {
	isConfigured = 'bt:e.block_individual_settings_is_configured',
	blockLocation = 'bt:e.block_individual_settings_block_location',
	blockDimension = 'bt:e.block_individual_settings_block_dimension',
	facingDirection = 'bt:e.block_individual_settings_facing_direction',
	elevatorTickParticles = 'bt:e.block_individual_settings_elevator_tick_particles',
	previousElevatorTickParticles = 'bt:e.block_individual_settings_previous_elevator_tick_particles'
}

export interface ElevatorsBlockIndividualSettings {
	// Indicates whether the elevator block is configured by the player or not
	[ElevatorsBlockIndividualSettingsIds.isConfigured]: boolean;
	// The location of the elevator block
	[ElevatorsBlockIndividualSettingsIds.blockLocation]: Vector3;
	// The dimension of the elevator block
	[ElevatorsBlockIndividualSettingsIds.blockDimension]: string;
	// The facing direction the elevator teleports the player, so they face that direction upon teleportation
	[ElevatorsBlockIndividualSettingsIds.facingDirection]: string;
	// Indicates whether the elevator block will tick particles on top of it or not
	[ElevatorsBlockIndividualSettingsIds.elevatorTickParticles]: boolean;
	// Preserves the previous elevator tick particles for each elevator blocks so that when the global elevators tick particles is set to disabled
	// then it won't lose its previous value if the global elevator ticks particles is set to enabled afterwards
	[ElevatorsBlockIndividualSettingsIds.previousElevatorTickParticles]: boolean | undefined;
}

export enum ElevatorsDynamicProperties {
	teleportSystemRunId = 'bt:e.teleport_system_run_id'
}

export interface Elevators {
	// The system run identifier of the elevator teleport
	teleportSystemRunId: number | undefined;
}
