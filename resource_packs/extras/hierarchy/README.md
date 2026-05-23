# Hierarchy Combinations

## Description

This directory contains combinations which belong to a hierarchy with other combinations.

A hierarchy means that one combination is a more specific version of another combination.  
More specific combinations are generated before less specific combinations.

For example:

```txt
consistent_old_bamboo
→ consistent_old_variated_bamboo

consistent_old_bamboo
→ consistent_oarless_old_bamboo
```

Each level should only add the textures or changes that are unique to that level.

---

## Pack Generation

Combinations are generated in descending hierarchy order.

More specific combinations are placed before less specific combinations during pack generation.  
Because of this, files from higher hierarchy combinations take priority over lower hierarchy combinations.

For example:

```txt
golden_savanna_lush_full_grass_sides
```

is generated before:

```txt
golden_savanna_lush_grass
golden_savanna_full_grass_sides
lush_full_grass_sides
```

---

## Hierarchy Rules

Only include the files that are unique to that hierarchy level.

Do not duplicate textures or files that already exist in a lower hierarchy combination.

For example, in the:

```txt
consistent_old_variated_bamboo
```

hierarchy:

- `consistent_old_variated_bamboo`
  only contains the variated bamboo plank textures.

- `consistent_old_bamboo`
  already provides the old bamboo plank and mosaic textures.

This keeps the hierarchy modular and prevents unnecessary duplication.

---

## Keeping Hierarchies Minimal

Keep hierarchies as small and modular as possible.

Large combinations should be built by layering smaller combinations together instead of duplicating files across every level.

Hierarchies can also be spread across multiple related combinations.

A good example of this structure is:

```txt
consistent_oarless_old_variated_bamboo
```

where:

- `consistent_old_bamboo`
  contains the old bamboo plank and mosaic textures.

- `consistent_old_variated_bamboo`
  only contains the variated bamboo plank textures.

- `consistent_oarless_old_bamboo`
  only contains the oarless boat textures.

This allows the final combination to reuse textures from multiple hierarchy levels without redefining every texture again.