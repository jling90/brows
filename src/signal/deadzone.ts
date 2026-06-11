/** Zero inside ±dz, then rescale the remaining range so output still spans [-1, 1]. */
export function applyDeadZone(v: number, dz: number): number {
  const a = Math.abs(v)
  if (a <= dz) return 0
  return (Math.sign(v) * (a - dz)) / (1 - dz)
}
