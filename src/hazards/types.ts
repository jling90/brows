export type Hazard =
  | { kind: 'stalagmite'; x: number; height: number } // rises from floor (y=0)
  | { kind: 'stalactite'; x: number; height: number } // hangs from ceiling
  | { kind: 'maw'; x: number; gapCenter: number; maxHalf: number } // aperture = Mouth Signal × maxHalf
  | { kind: 'clamp'; x: number; gapCenter: number; maxHalf: number } // inverted Maw: aperture = (1 − Mouth Signal) × maxHalf
