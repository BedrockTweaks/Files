/**
 * §3c — death capture. With keepInventory forced on, nothing is dropped: at
 * `entityDie` the player's container, equipment and XP are still populated,
 * so we read them, copy them into the grave, and clear them ourselves. No
 * drop-vacuuming, no tick ids, no races between same-tick deaths.
 */
import { EntityComponentTypes, GameMode, world } from '@minecraft/server';
import { config } from '../registration';
import { PLAYER_CONTAINER_SLOTS } from '../constants';
import { EQUIP_SLOTS, graveEntity, removeGrave } from '../lifecycle';
import { markPurge, visibleRecordsOf } from '../index/store';
import { solvePlacement } from './placement';
import { spawnGrave, dimensionFor, type DeathSnapshot } from './spawn';
import { isAddonDisabled } from './keepInventory';
import { i18n } from '../UI/i18n';
import { dimName, isPlayer } from '../util';

/** drop_oldest: tombstone (or remove, if loaded) the owner's oldest grave. */
const dropOldest = (ownerId: string): void => {
  const oldest = [...visibleRecordsOf(ownerId)].sort((a, b) => a.diedAt - b.diedAt)[0];

  if (!oldest) {
    return;
  }

  const entity = graveEntity(oldest.id);

  if (entity) {
    removeGrave(entity);
  } else {
    markPurge(oldest.id);
  }
};

export function initCapture(): void {
  world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (!isPlayer(deadEntity) || isAddonDisabled()) {
      return;
    }

    const player = deadEntity;

    if (player.getGameMode() === GameMode.Spectator) {
      return;
    }

    const inventory = player.getComponent<EntityComponentTypes.Inventory>(EntityComponentTypes.Inventory)?.container;
    const equippable = player.getComponent<EntityComponentTypes.Equippable>(EntityComponentTypes.Equippable);

    if (!inventory || !equippable) {
      return;
    }

    const contents = config.server.contents.get();
    const totalXp = player.getTotalXp();
    const xp = contents.pickUpXp ? Math.floor((totalXp * contents.xpPercent) / 100) : 0;

    const snapshot: DeathSnapshot = { items: [], equipment: [], itemCount: 0, xp };

    for (let slot = 0; slot < PLAYER_CONTAINER_SLOTS; slot++) {
      const item = inventory.getItem(slot);

      snapshot.items.push(item);

      if (item) {
        snapshot.itemCount += item.amount;
      }
    }

    for (const equipSlot of EQUIP_SLOTS) {
      const item = equippable.getEquipment(equipSlot);

      snapshot.equipment.push(item);

      if (item) {
        snapshot.itemCount += item.amount;
      }
    }

    if (snapshot.itemCount === 0 && xp <= 0) {
      return;
    }

    snapshot.cause = damageSource.cause;
    snapshot.killer = damageSource.damagingEntity?.typeId;

    const { t } = i18n.forPlayer(player);
    const lifetime = config.server.lifetime.get();
    const graveCount = visibleRecordsOf(player.id).length;

    if (lifetime.maxGravesPerPlayer > 0 && graveCount >= lifetime.maxGravesPerPlayer) {
      if (lifetime.onLimitReached === 'block_new') {
        // keepInventory is on — skipping the grave means the player keeps everything.
        player.sendMessage(t($ => $.death.capBlocked, { count: graveCount }));

        return;
      }

      dropOldest(player.id);
      player.sendMessage(t($ => $.death.capDropped));
    }

    const placement = solvePlacement(player.dimension, player.location, player);
    const record = spawnGrave(dimensionFor(placement, player.dimension), placement, player, snapshot);

    if (!record) {
      // Engine refused the grave (spike 2 failure path) — the player keeps everything.
      return;
    }

    // Only now that the grave holds the items do we take them from the player.
    inventory.clearAll();

    for (const equipSlot of EQUIP_SLOTS) {
      equippable.setEquipment(equipSlot, undefined);
    }

    if (contents.pickUpXp) {
      player.resetLevel();
    }

    if (config.player.for(player).showDeathToast.get()) {
      const bound = i18n.forPlayer(player);
      const args = { x: record.x, y: record.y, z: record.z, dimension: dimName(bound, record.dim) };

      if (placement.fallback) {
        player.sendMessage(bound.t($ => $.death.fallback, { x: record.x, y: record.y, z: record.z }));
      } else if (record.floating) {
        player.sendMessage(bound.t($ => $.death.floating, { x: record.x, y: record.y, z: record.z }));
      } else {
        player.sendMessage(bound.t($ => $.death.toast, args));
      }
    }

    // Spike 1 diagnostics (§10): confirms the container was still populated and
    // whether Bedrock's keepInventory retains XP. Cheap enough to keep.
    console.info(`[graves] captured ${String(snapshot.itemCount)} items, xp=${String(totalXp)} (stored ${String(xp)}) for ${player.name}`);
  }, { entityTypes: ['minecraft:player'] });
}
