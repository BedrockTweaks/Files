import {
  EntityDieAfterEvent,
  EntityHitEntityAfterEvent,
  Player,
  ScriptEventCommandMessageAfterEvent,
  system,
  world
} from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { GravesEntityTypes, GravesScriptEvents } from '../../Models';
import { initializeSettings } from './settings';
import { openGrave } from './openGrave';
import { spawnGrave } from './spawnGrave';
import { uninstall } from './uninstall';
import { openConfigInterface } from '../../UI/Config';

world.afterEvents.playerJoin.subscribe((): void => {
  initializeSettings();
});

system.afterEvents.scriptEventReceive.subscribe((event: ScriptEventCommandMessageAfterEvent): void => {
  const { id, sourceEntity } = event;

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

world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent): void => {
  const { deadEntity } = event;

  if (deadEntity.id === MinecraftEntityTypes.Player) {
    spawnGrave(deadEntity as Player);
  }
});

world.afterEvents.entityHitEntity.subscribe((event: EntityHitEntityAfterEvent): void => {
  const { damagingEntity, hitEntity } = event;

  if (
    damagingEntity.typeId === MinecraftEntityTypes.Player &&
    hitEntity.typeId === GravesEntityTypes.Grave
  ) {
    openGrave(damagingEntity as Player, hitEntity);
  }
});

