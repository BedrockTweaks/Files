interface CompatibleOverlap {
  packs: readonly [string, string];
  files: readonly string[];
  reason: string;
}

// Use full pack paths or literal category paths ending in /. File paths are
// relative to the resource pack root and must match exactly.
export const compatibleOverlapRules: readonly CompatibleOverlap[] = [
  {
    packs: ['utility/sticky_piston_sides', 'world_of_color/slimes/'],
    files: [
      'textures/blocks/piston_side_sticky.png',
      'textures/blocks/piston_top_sticky.png',
      'textures/entity/pistonarm/pistonArmSticky.png',
    ],
    reason: 'Sticky Piston Sides supplies the block and atlas mappings. Slime colors have higher priority, so their recolored piston faces and arm textures are used.',
  },
];
