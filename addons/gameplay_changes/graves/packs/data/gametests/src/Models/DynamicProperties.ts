import { Vector3 } from '@minecraft/server';
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data';

export enum GravesSettingsDynamicProperties {
	initialized = 'bt:g.settings_initialized',
	graveRobbing = 'bt:g.settings_grave_robbing',
	xpCollection = 'bt:g.settings_xp_collection',
	graveLocating = 'bt:g.settings_grave_locating',
	despawnTime = 'bt:g.settings_despawn_time',
	keepInventory = 'bt:g.keep_inventory'
}

export interface GravesSettings {
	initialized: boolean;
	graveRobbing: boolean;
	xpCollection: boolean;
	graveLocating: boolean;
	despawnTime: number;
	keepInventory: boolean;
}

export enum GraveDynamicProperties {
	id = 'bt:g.id',
	owner = 'bt:g.owner',
	location = 'bt:g.location',
	dimension = 'bt:g.dimension',
	spawnTime = 'bt:g.spawn_time',
	itemCount = 'bt:g.item_count',
	playerExperience = 'bt:g.player_experience'
}

export interface Grave {
	id: string;
	owner: string;
	location: Vector3;
	dimension: MinecraftDimensionTypes;
	spawnTime: number;
	itemCount: number;
	playerExperience: number;
}

export enum GravesListDynamicProperties {
	list = 'bt:g.graves_list'
}

export interface GravesList {
	// Stringified Grave[]
	list: string;
}
