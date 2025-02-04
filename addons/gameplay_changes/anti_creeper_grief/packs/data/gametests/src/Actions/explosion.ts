import {
	system,
	ExplosionBeforeEvent,
	Vector3,
	Entity
} from '@minecraft/server';
import { getSettings } from '../Actions';
import {
	AntiCreeperGriefSettings,
	AntiCreeperGriefParticles,
	AntiCreeperGriefSounds
} from '../Models';

export const disableExplosion = async(explosion: ExplosionBeforeEvent): Promise<void> => {
	const entity = explosion.source as Entity;
	const { dimension } = explosion;
	const { creepersDoDamage }: AntiCreeperGriefSettings = getSettings();

	if (creepersDoDamage) {
		// creeper will do damage to entities
		explosion.setImpactedBlocks([]);
	} else {
		// creeper will NOT do damage to entities
		explosion.cancel = true;
		const loc: Vector3 = entity.location;
		await system.waitTicks(1);
		dimension.spawnParticle(AntiCreeperGriefParticles.explosion, loc);
		dimension.playSound(AntiCreeperGriefSounds.explosion, loc);
	}
};
