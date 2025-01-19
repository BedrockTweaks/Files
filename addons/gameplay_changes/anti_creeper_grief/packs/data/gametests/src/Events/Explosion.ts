import {
    world,
    system,
    ExplosionBeforeEvent,
    Vector3
} from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { getSettings } from '../Actions';
import { AntiCreeperGriefSettings } from '../Models';

world.beforeEvents.explosion.subscribe((explosionEvent: ExplosionBeforeEvent): void => {
    // destructuring is weird in QuickJS
    // 'setImpactedBlocks' doesnt like being destructuring, likewise neither does 'cancel' for reasons unknown to me.
    // -Squatch
    const { source, dimension } = explosionEvent

    // guard clause rather then nested if
    if (!source?.matches({ type: MinecraftEntityTypes.Creeper })) return;

    // get the settings
    const acgSettings: AntiCreeperGriefSettings = getSettings();

    // if settings are set for creepers to damage players
    if (acgSettings.creepers_do_damage == true) {
        // set list of impacted blocks to empty, no longer breaks blocks
        explosionEvent.setImpactedBlocks([]);
    } else {
        // cancel the event
        explosionEvent.cancel = true;
        // copy location data, since the source.location data is about to disappear
        const loc: Vector3 = { x: source.location.x, y: source.location.y, z: source.location.z };
        // skip a tick, for required priviledge
        system.run(() => {
            // create particle to fake the explosion
            dimension.spawnParticle(`minecraft:dragon_death_explosion_emitter`, loc);
            dimension.playSound(`random.explode`, loc);
        });
    };
});