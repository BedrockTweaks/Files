/**
 * Generates the GameTest pad: `packs/BP/structures/graves/pad.mcstructure`.
 *
 * A GameTest needs a structure, and it resolves the name against the BEHAVIOUR
 * PACK structure store — `structures/<namespace>/<name>.mcstructure`. A
 * world-saved structure written from script (`structureManager.createEmpty` +
 * `saveToWorld`) is NOT enough: the game accepts and stores it, but the test
 * framework does not find it and silently falls back to a small default area,
 * which shows up as `gameTest.assert.couldNotSetBlock` the moment a test
 * touches a coordinate past that default. So the file is generated here and
 * committed.
 *
 *   node tools/pad.mjs          (or: yarn pad)
 *
 * The pad is a hollow box: one solid floor layer, air above it. Its size must
 * stay in step with `PAD_SIZE` in `packs/BP/scripts/tests/harness.ts`.
 *
 * `.mcstructure` is uncompressed LITTLE-ENDIAN NBT — the same tag set as Java
 * NBT with every integer and the string-length prefix byte-swapped, and no
 * gzip wrapper.
 *
 * STRIP BEFORE RELEASE: this file, `packs/BP/structures/`, `manifest.test.json`,
 * `tsconfig.test.json` and `packs/BP/scripts/tests/` are all test-only.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'packs', 'BP', 'structures', 'graves', 'pad.mcstructure');

/** Must match PAD_SIZE in tests/harness.ts. */
const SIZE = { x: 16, y: 16, z: 16 };

/** Must match PAD_FLOOR_Y in tests/harness.ts. */
const FLOOR_Y = 0;

const FLOOR_BLOCK = 'minecraft:stone';

/**
 * Block-palette version stamp, (major << 24) | (minor << 16) | (patch << 8) | revision
 * — 1.21.44.1 here. Only matters for state upgrading, and both blocks in this
 * palette are state-free, so the exact value is not load-bearing.
 */
const BLOCK_VERSION = (1 << 24) | (21 << 16) | (44 << 8) | 1;

const TAG = { end: 0, byte: 1, short: 2, int: 3, string: 8, list: 9, compound: 10 };

class Nbt {
  constructor() {
    this.parts = [];
  }

  u8(value) {
    const b = Buffer.alloc(1);

    b.writeUInt8(value);
    this.parts.push(b);

    return this;
  }

  i32(value) {
    const b = Buffer.alloc(4);

    b.writeInt32LE(value);
    this.parts.push(b);

    return this;
  }

  str(value) {
    const data = Buffer.from(value, 'utf8');
    const length = Buffer.alloc(2);

    length.writeUInt16LE(data.length);
    this.parts.push(length, data);

    return this;
  }

  /** Tag header: type byte + name. Payload is written by the caller. */
  named(type, name) {
    return this.u8(type).str(name);
  }

  namedInt(name, value) {
    return this.named(TAG.int, name).i32(value);
  }

  namedString(name, value) {
    return this.named(TAG.string, name).str(value);
  }

  /** A list of ints, e.g. `size` and `structure_world_origin`. */
  namedIntList(name, values) {
    this.named(TAG.list, name).u8(TAG.int).i32(values.length);

    for (const value of values) {
      this.i32(value);
    }

    return this;
  }

  /** An empty list. An empty list's element type is written as TAG_End. */
  namedEmptyList(name) {
    return this.named(TAG.list, name).u8(TAG.end).i32(0);
  }

  openCompound(name) {
    return this.named(TAG.compound, name);
  }

  closeCompound() {
    return this.u8(TAG.end);
  }

  namedEmptyCompound(name) {
    return this.openCompound(name).closeCompound();
  }

  toBuffer() {
    return Buffer.concat(this.parts);
  }
}

/**
 * Block indices, one entry per cell, in the order the format expects:
 * x outermost, then y, then z. The value is an index into the block palette.
 */
const layerZero = () => {
  const indices = [];

  for (let x = 0; x < SIZE.x; x++) {
    for (let y = 0; y < SIZE.y; y++) {
      for (let z = 0; z < SIZE.z; z++) {
        indices.push(y === FLOOR_Y ? 1 : 0);
      }
    }
  }

  return indices;
};

const build = () => {
  const cells = SIZE.x * SIZE.y * SIZE.z;
  const nbt = new Nbt();

  // Root compound, unnamed.
  nbt.openCompound('');
  nbt.namedInt('format_version', 1);
  nbt.namedIntList('size', [SIZE.x, SIZE.y, SIZE.z]);

  nbt.openCompound('structure');

  // block_indices is a list of two layers: blocks, then the waterlogging layer.
  nbt.named(TAG.list, 'block_indices').u8(TAG.list).i32(2);

  nbt.u8(TAG.int).i32(cells);

  for (const index of layerZero()) {
    nbt.i32(index);
  }

  // Layer 1: -1 everywhere means "nothing here", which is what an unwaterlogged
  // structure carries.
  nbt.u8(TAG.int).i32(cells);

  for (let i = 0; i < cells; i++) {
    nbt.i32(-1);
  }

  nbt.namedEmptyList('entities');

  nbt.openCompound('palette');
  nbt.openCompound('default');

  nbt.named(TAG.list, 'block_palette').u8(TAG.compound).i32(2);

  for (const name of ['minecraft:air', FLOOR_BLOCK]) {
    nbt.namedString('name', name);
    nbt.namedEmptyCompound('states');
    nbt.namedInt('version', BLOCK_VERSION);
    nbt.closeCompound();
  }

  nbt.namedEmptyCompound('block_position_data');

  nbt.closeCompound(); // default
  nbt.closeCompound(); // palette
  nbt.closeCompound(); // structure

  nbt.namedIntList('structure_world_origin', [0, 0, 0]);
  nbt.closeCompound(); // root

  return nbt.toBuffer();
};

const data = build();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, data);
console.log(`wrote ${OUT} — ${SIZE.x}x${SIZE.y}x${SIZE.z}, floor ${FLOOR_BLOCK} at y=${FLOOR_Y}, ${data.length} bytes`);
