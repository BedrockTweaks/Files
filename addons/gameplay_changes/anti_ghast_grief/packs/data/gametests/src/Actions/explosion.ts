import { ExplosionBeforeEvent } from '@minecraft/server';

export const disableExplosion = async(explosion: ExplosionBeforeEvent): Promise<void> => {
	// TODO: add config? similar to ACG
	// ISSUE: Ghast projectiles always do damage, even if "explosion" is cancelled,
	// so direct hits will still do damage, and the explosion is so small not to worry about.
	// TODO: decide if splitting this function out is worth it?
	explosion.setImpactedBlocks([]);
};
