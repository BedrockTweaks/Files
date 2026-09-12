/**
 * Entry point. `core.register()` happens in ./registration (imported first so
 * every module sees the typed config); `ui(core)` mounts the shared config /
 * guide / addon-list UI and this addon's `<ns>:config|configat|guide|list`
 * commands. Everything else is explicit wiring, in dependency order.
 */
import { ui } from '@bedrock-core/ui/config';
import { core } from './registration';
import { initImpenetrable } from './death/impenetrable';
import { initKeepInventory } from './death/keepInventory';
import { initCapture } from './death/capture';
import { initGate } from './open/gate';
import { initAttack } from './open/attack';
import { initReconcile } from './index/reconcile';
import { initDespawn } from './despawn';
import { initLocator } from './locator';
import { initCommands } from './commands';
import { initRpc } from './rpc';

ui(core);

// initCommands must subscribe to system.beforeEvents.startup in early execution.
initCommands();
initKeepInventory();
initImpenetrable();
initCapture();
initGate();
initAttack();
initReconcile();
initDespawn();
initLocator();
initRpc();
