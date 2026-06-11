# Synthwave gradient palette; readability via intensity and shape, not hue

The art direction is neon wireframe synthwave with a full sunset gradient (magenta→orange→cyan) applied aesthetically across the scene — hue carries no gameplay meaning. The recommended alternative (semantic two-tone: cyan = player, magenta = hazard) was rejected in favor of the stronger aesthetic. Readability is instead carried by two redundant channels: only gameplay-critical geometry (Hazards, Track, Pen, Cart) renders at full bloom intensity while scenery stays dim, and deadly silhouettes are jagged while safe ones are smooth.

Rendering treatment: solid near-black faces with emissive edge lines (not true transparent wireframe), so occlusion preserves depth readability. Bloom is a desktop post-processing pass; mobile falls back to pre-brightened emissive colors with no bloom pass.

## Consequences

- Hazards can never rely on color to be identified; jagged-vs-smooth silhouette discipline must be enforced in all future hazard designs.
- The intensity hierarchy (bright = gameplay, dim = scenery) must be respected by any new visual element, including UI and the Avatar.
