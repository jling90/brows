# Mobile support in v1, landscape required

Desktop-only was the recommended v1 scope, but mobile (front camera) support was deliberately included from day one. Landscape orientation is required on mobile — portrait shows a rotate-your-phone overlay and pauses — because the side-scrolling layout needs horizontal lookahead to keep reaction windows fair.

## Consequences

- Performance budget must account for MediaPipe + three.js on mid-range phones: capped device pixel ratio, face tracking allowed to run below render FPS with interpolation.
- The testing matrix includes mobile Safari and mobile Chrome, not just desktop browsers.
