import { graveDirectory } from '../storage/documents';

/** Persist the locator preference for an existing grave. */
export const setWaypointVisibility = (graveId: string, shown: boolean): void => {
  if (!graveDirectory.get()?.records[graveId]) {
    return;
  }

  graveDirectory.patch({ records: { [graveId]: { noWaypoint: shown ? undefined : true } } });
};
