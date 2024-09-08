import {
  DataDrivenEntityTriggerAfterEvent,
  EntityDieAfterEvent,
  EntityHitEntityAfterEvent,
  Player,
  ScriptEventCommandMessageAfterEvent,
  system,
  world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { forceOpenGrave, initializeSettings, openGrave, spawnGrave, uninstall } from './Functions';
import { GraveEntityEvents, GravesEntityTypes, GravesScriptEvents } from './Models';
import { openConfigInterface } from './UI';

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }: ScriptEventCommandMessageAfterEvent): void => {
  switch (id) {
    case GravesScriptEvents.config:
      openConfigInterface(sourceEntity);
      break;

    case GravesScriptEvents.uninstall:
      uninstall();
      break;

    default:
      break;
  }
});

world.afterEvents.playerJoin.subscribe((): void => {
  initializeSettings();
});

world.afterEvents.entityDie.subscribe(({ deadEntity }: EntityDieAfterEvent): void => {
  if (deadEntity.typeId === MinecraftEntityTypes.Player) {
    spawnGrave(deadEntity as Player);
  }
});

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }: EntityHitEntityAfterEvent): void => {
  if (
    damagingEntity.typeId === MinecraftEntityTypes.Player &&
    hitEntity.typeId === GravesEntityTypes.Grave
  ) {
    openGrave(damagingEntity as Player, hitEntity);
  }
});

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }: DataDrivenEntityTriggerAfterEvent): void => {
  if (entity.typeId === GravesEntityTypes.Grave && eventId === GraveEntityEvents.DropItems) {
    forceOpenGrave(entity);
  }
});

// TODO despawn time for graves
