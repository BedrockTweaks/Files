import { EntityDieAfterEvent, world } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { checkEntities } from '../Actions';

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }: EntityDieAfterEvent): void => {
	void checkEntities(deadEntity, damageSource);
}, { entityTypes: [MinecraftEntityTypes.Husk] });
