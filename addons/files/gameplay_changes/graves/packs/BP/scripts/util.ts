/** Small formatting helpers and guards shared across the addon. */
import type { Dimension, Entity, Player, RawMessage } from '@minecraft/server';
import { world } from '@minecraft/server';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';
import { i18n } from './UI/i18n';

export const isPlayer = (entity: Entity): entity is Player => entity.typeId === MinecraftEntityTypes.Player;

/**
 * A stored `record.dim` resolved back to a live dimension, or undefined.
 *
 * `world.getDimension` throws on an id it does not know rather than returning
 * undefined, and records outlive the session that wrote them: an id from a
 * custom-dimension pack survives that pack being removed. Every read of
 * `record.dim` goes through here so a stale id skips work instead of taking
 * down the caller (purge.ts guards its own, inside the ticking-area loop).
 */
export const dimensionOf = (dimId: string): Dimension | undefined => {
  try {
    return world.getDimension(dimId);
  } catch {
    return undefined;
  }
};

/** The verb set i18n.forPlayer()/useTranslation() hand out. */
export type Bound = ReturnType<typeof i18n.forPlayer>;

export const posStr = (x: number, y: number, z: number): string => `${x} ${y} ${z}`;

/** Localized dimension name; unknown (custom) dimensions fall back to their id. */
export const dimName = ({ t }: Bound, dimId: string): string => {
  switch (dimId) {
    case 'minecraft:overworld': return t($ => $.dim.overworld);
    case 'minecraft:nether': return t($ => $.dim.nether);
    case 'minecraft:the_end': return t($ => $.dim.the_end);
    default: return dimId.replace('minecraft:', '');
  }
};

/** "2h 14m ago" from an epoch-ms timestamp. */
export const agoStr = ({ t }: Bound, diedAt: number): string => {
  const totalMinutes = Math.max(0, Math.floor((Date.now() - diedAt) / 60_000));

  if (totalMinutes < 1) {
    return t($ => $.time.now);
  }

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return t($ => $.time.days, { d: days, h: hours });
  }

  if (hours > 0) {
    return t($ => $.time.hours, { h: hours, m: minutes });
  }

  return t($ => $.time.minutes, { m: minutes });
};

/**
 * "Slain by Zombie" with the killer's name resolved on the client in the
 * viewer's language via the vanilla entity key, or a plain cause string.
 */
export const causeText = ({ raw, t }: Bound, cause?: string, killer?: string): RawMessage | string | undefined => {
  if (killer) {
    return raw($ => $.detail.slainBy, { killer: { translate: `entity.${killer.replace('minecraft:', '')}.name` } });
  }

  if (cause) {
    return t($ => $.detail.cause, { cause });
  }

  return undefined;
};

const pad = (n: number): string => String(n).padStart(2, '0');

/** Static date stamp baked into a grave's name tag (style `name_and_time`). */
export const dateStamp = (ms: number): string => {
  const d = new Date(ms);

  return `${String(d.getUTCFullYear())}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
