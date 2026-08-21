/**
 * GameTests for this addon.
 *
 * Build and deploy them with `yarn build:test`, then open a world with Beta
 * APIs enabled, cheats on, creative, flat, normal difficulty:
 *
 *   /gametest runset graves_ready      — everything that is written and should pass
 *   /gametest runset graves_todo       — everything still to write; all red, on purpose
 *   /gametest runset graves_placement  — one group (also: _capture, _open, _state)
 *   /gametest runset graves            — the class name: EVERY test, todos included
 *   /gametest run graves:pad_probe     — start here when a whole group fails at once
 *
 * @minecraft/server-gametest is a beta module, so only this build declares it.
 * `yarn build` and `yarn watch` produce a pack with no beta modules at all.
 *
 * Nothing here writes to chat. `test.print` broadcasts to every player in the
 * world and a runset would bury the game in it, so diagnostics go to the
 * content log (`%APPDATA%\Minecraft Bedrock\logs\ContentLog*.txt`, with
 * Settings → Creator → Content Log File on).
 *
 * Layout: `harness.ts` owns the pad, the cleanup and the config lock; the four
 * modules below are the tests, grouped the way the addon is. A test starts life
 * as a `todo(...)` carrying the plan for it, and becomes real by swapping that
 * call for `graveTest(...)` / `graveTestAsync(...)` — which also moves it off
 * the `graves_todo` tag and onto `graves`.
 */
import { graveTest, padIsLoaded, snapshotWorld } from './harness';
import { system } from '@minecraft/server';

import './placement';
import './capture';
import './open';
import './state';

// Reads world state, so it may not run at module load (early execution).
system.run(snapshotWorld);

graveTest('the_addon_loads', (test) => {
  // main.ts has already run by the time a test executes, so getting here at all
  // proves the addon registered without throwing.
  test.succeed();
}, { ticks: 20 });

/**
 * The suite's precondition, and the first thing to run when a whole group fails
 * at once. GameTest does not report a missing structure — it substitutes a small
 * default area and lets the first out-of-bounds write fail as
 * `gameTest.assert.couldNotSetBlock`, which says nothing about the cause. This
 * measures the area instead and names the fix.
 */
graveTest('pad_probe', (test) => {
  const complaint = padIsLoaded(test);

  if (complaint) {
    console.error(`[graves:test] ${complaint}`);
  }

  test.assert(complaint === undefined, `${String(complaint)}. Run 'yarn pad', rebuild, and reload the world.`);
  test.succeed();
}, { ticks: 20 });
