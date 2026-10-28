/**
 * GameTest entry point — bundled only by the `test` profile.
 *
 * The test profiles select manifest.test.json, which declares the beta module
 * and selects scripts/gametest.js as the bundler entry. tsconfig.test.json
 * supplies the test TypeScript configuration.
 *
 * Everything the release ships comes in through `./main`; the tests live in `./tests`. main.ts must
 * never import from here — that one rule is what keeps the beta module out of a release build.
 */
import './main';
import './tests';
import { graveScreen } from './UI/grave_container';

// GameTest can invalidate a simulated player before its delayed initial-spawn
// event is delivered. The production container runtime correctly serves real
// players; the suite exercises the same logical slot view without installing
// that runtime's player-lifecycle listener into the synthetic test world.
graveScreen.detach();
