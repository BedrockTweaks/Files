import { Vector3 } from '@minecraft/server';
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data';

/**
 * Definitions to use multiple Dynamic Properties as a Typed Object
 * Enum keys and object properties should match for proper conversion.
 */
export enum GravesSettingsDynamicProperties {
	initialized = 'bt:g.settings_initialized',
	graveRobbing = 'bt:g.settings_grave_robbing',
	xpCollection = 'bt:g.settings_xp_collection',
	graveLocating = 'bt:g.settings_grave_locating',
	despawnTime = 'bt:g.settings_despawn_time',
	keepInventory = 'bt:g.keep_inventory'
}

export interface GravesSettings {
	// Indicates whether the graves system settings have been initialized.
	initialized: boolean;
	// Controls whether grave robbing is allowed.
	graveRobbing: boolean;
	// Controls whether XP can be collected from graves.
	xpCollection: boolean;
	// Controls whether there will be a chat message with the coordinates of their death
	graveLocating: boolean;
	// Specifies the time (in seconds) before graves automatically despawn and their contents are deleted
	despawnTime: number;
	// Stores the value of the keepInventory gamerule before installing the addon to be restored on uninstall
	keepInventory: boolean;
}

export enum GraveDynamicProperties {
	id = 'bt:g.id',
	ownerId = 'bt:g.owner_id',
	ownerName = 'bt.g.owner_name',
	location = 'bt:g.location',
	dimension = 'bt:g.dimension',
	spawnTime = 'bt:g.spawn_time',
	itemCount = 'bt:g.item_count',
	playerExperience = 'bt:g.player_experience'
}

export interface Grave {
	// The ID of the Grave
	id: string;
	// The ID of the player who owns the grave.
	ownerId: string;
	// The nametag of the player who owns the grave.
	// Note: player nametags might change, so we check owner with id, but we also save the name to be able to display it in
	// the graves list as you cannot get offline player data. If player changes nametag while there are graves on the world,
	// and they do not spawn a new grave, it will show the old nametag but because is associated with id, the player will
	// still be able to open the grave
	ownerName: string;
	// The location of the grave in the world
	location: Vector3;
	// The dimension where the grave is located
	dimension: MinecraftDimensionTypes;
	// The time in ticks since the start of the world indicating when the grave was created
	spawnTime: number;
	// The total number of items stored in the grave
	itemCount: number;
	// The amount of experience points stored in the grave
	playerExperience: number;
}

export enum GravesListDynamicProperties {
	list = 'bt:g.graves_list'
}

export interface GravesList {
	// Stringified Grave[]
	list: string;
}
