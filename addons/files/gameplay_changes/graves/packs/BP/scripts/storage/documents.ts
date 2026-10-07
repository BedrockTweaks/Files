import { entityTypes, schema, worldTarget, type Collection, type Document } from '@bedrock-core/server';
import { observable } from '@bedrock-core/server/observable';
import { system, world, type Entity } from '@minecraft/server';
import { GRAVE_ENTITY } from '../constants';
import { core } from '../registration';
import type { GraveCollectionDocument, GraveRecord } from '../types';

export interface WorldState {
  disabled?: boolean;
  previousKeepInventory?: boolean;
}

export let graveDirectory: Document<GraveCollectionDocument>;
export let graveDocuments: Collection<GraveRecord, Entity>;
export let worldState: Document<WorldState>;

/** Build-safe reactive view used by screens after the world document is ready. */
export const graveRecords = observable<GraveCollectionDocument | undefined>(undefined, { label: 'graves.records' });

/** Called after addon registration, before subscribing gameplay handlers. */
export const initDocuments = (): void => {
  /** Metadata remains discoverable when the grave's entity is unloaded. */
  graveDirectory = core.db.collection('graves', {
    schema: schema<GraveCollectionDocument>({ version: 1, defaults: { records: {} } }),
    accept: worldTarget(),
  }).for(world);

  graveDirectory.subscribe(next => graveRecords.set(next));
  system.run(() => graveRecords.set(graveDirectory.get()));

  /** The entity keeps a recovery copy beside its engine-persisted inventory. */
  graveDocuments = core.db.collection('grave', {
    schema: schema<GraveRecord>({ version: 1 }),
    accept: entityTypes(GRAVE_ENTITY),
  });

  worldState = core.db.collection('state', {
    schema: schema<WorldState>({ version: 1 }),
    accept: worldTarget(),
  }).for(world);
};
