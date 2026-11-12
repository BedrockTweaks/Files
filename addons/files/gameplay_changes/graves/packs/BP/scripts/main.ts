/**
 * Entry point. Initializes registration, documents and gameplay listeners. The
 * builder installs compiled action/container screen metadata before gameplay.
 */
import { initCommands } from './commands';
import { initCapture } from './death/capture';
import { initImpenetrable } from './death/impenetrable';
import { initKeepInventory } from './death/keepInventory';
import { initRepelling } from './death/repelling';
import { initDespawn } from './despawn';
import { initLocator } from './locator';
import { initAttack } from './open/attack';
import { initGate } from './open/gate';
import { initRegistration } from './registration';
import { initDocuments } from './storage/documents';
import { initReconcile } from './storage/reconcile';

initRegistration();
initDocuments();

// initCommands must subscribe to system.beforeEvents.startup in early execution.
initCommands();
initKeepInventory();
initImpenetrable();
initRepelling();
initCapture();
initGate();
initAttack();
initReconcile();
initDespawn();
initLocator();
