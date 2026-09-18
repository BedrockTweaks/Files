/**
 * The grave index (§6) — world dynamic properties, one JSON array per owner,
 * plus an owners list so the admin surface can enumerate without scanning.
 * The index is authoritative; grave entities are payloads that may or may not
 * be loaded. Every mutation re-publishes a summary to `core.state` so other
 * addons can read counts synchronously (§6/§7).
 */
import { world } from '@minecraft/server';
import { core } from '../registration';
import { PROP_IDX_PREFIX, PROP_OWNERS } from '../constants';
import type { GraveRecord } from '../types';

const readJson = <T>(key: string): T | undefined => {
  const value = world.getDynamicProperty(key);

  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON we wrote ourselves; shape is by construction
    return JSON.parse(value) as T;
  } catch {
    console.error(`[graves] corrupt index property '${key}' — dropping it`);
    world.setDynamicProperty(key, undefined);

    return undefined;
  }
};

export const ownerIds = (): string[] => readJson<string[]>(PROP_OWNERS) ?? [];

/** All records for one owner, tombstones included. */
export const recordsOf = (ownerId: string): GraveRecord[] => readJson<GraveRecord[]>(`${PROP_IDX_PREFIX}${ownerId}`) ?? [];

/** The owner's graves as shown in UIs and counts — tombstones excluded. */
export const visibleRecordsOf = (ownerId: string): GraveRecord[] => recordsOf(ownerId).filter(r => !r.purge);

export const allRecords = (includeTombstones = false): GraveRecord[] => {
  const all: GraveRecord[] = [];

  for (const owner of ownerIds()) {
    for (const record of recordsOf(owner)) {
      if (includeTombstones || !record.purge) {
        all.push(record);
      }
    }
  }

  return all;
};

export const byEntityId = (graveId: string): GraveRecord | undefined => {
  for (const owner of ownerIds()) {
    const match = recordsOf(owner).find(r => r.id === graveId);

    if (match) {
      return match;
    }
  }

  return undefined;
};

const publishSummary = (): void => {
  const owners: Record<string, number> = {};
  let total = 0;

  for (const owner of ownerIds()) {
    const count = visibleRecordsOf(owner).length;

    if (count > 0) {
      owners[owner] = count;
      total += count;
    }
  }

  core.state.set('graves', { total, owners });
};

const writeOwner = (ownerId: string, records: GraveRecord[]): void => {
  const owners = ownerIds();

  if (records.length === 0) {
    world.setDynamicProperty(`${PROP_IDX_PREFIX}${ownerId}`, undefined);
    world.setDynamicProperty(PROP_OWNERS, JSON.stringify(owners.filter(o => o !== ownerId)));
  } else {
    world.setDynamicProperty(`${PROP_IDX_PREFIX}${ownerId}`, JSON.stringify(records));

    if (!owners.includes(ownerId)) {
      world.setDynamicProperty(PROP_OWNERS, JSON.stringify([...owners, ownerId]));
    }
  }

  publishSummary();
};

export const addRecord = (record: GraveRecord): void => {
  writeOwner(record.owner, [...recordsOf(record.owner).filter(r => r.id !== record.id), record]);
};

/** Write back a mutated record (position drift, purge flag, ...). */
export const updateRecord = (record: GraveRecord): void => {
  writeOwner(record.owner, recordsOf(record.owner).map(r => (r.id === record.id ? record : r)));
};

export const removeRecord = (graveId: string): void => {
  const record = byEntityId(graveId);

  if (record) {
    writeOwner(record.owner, recordsOf(record.owner).filter(r => r.id !== graveId));
  }
};

/** Tombstone: hidden everywhere, entity deleted the moment its chunk loads (§6a). */
export const markPurge = (graveId: string): void => {
  const record = byEntityId(graveId);

  if (record && !record.purge) {
    updateRecord({ ...record, purge: true });
  }
};

export const tombstoneCount = (): number => allRecords(true).filter(r => r.purge).length;
