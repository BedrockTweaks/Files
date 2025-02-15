import { WorldSoundOptions } from '@minecraft/server';

export enum ElevatorsSounds {
	playerTeleport = 'mob.shulker.teleport'
}

export const PlayerTeleportSoundOptions: WorldSoundOptions = {
	volume: 4,
	pitch: 1,
};
