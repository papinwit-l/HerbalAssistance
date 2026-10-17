/* Turn the list's dose in mg into a tablet count for the strength printed on the box.
   Never rounds past the list's range: the low end rounds up, the high end rounds down,
   and if no whole number of tablets fits, there is no count (follow the label / ask). */

/** Common strengths on Thai herbal capsules and tablets, in mg. */
export const STRENGTHS_MG = [200, 250, 300, 400, 500] as const;

export interface TabletCount {
  min: number;
  max: number;
}

export function tabletCount(doseMin: number, doseMax: number, strengthMg: number): TabletCount | null {
  const eps = 1e-9;
  const min = Math.max(1, Math.ceil(doseMin / strengthMg - eps));
  const max = Math.floor(doseMax / strengthMg + eps);
  return min <= max ? { min, max } : null;
}

export function countText({ min, max }: TabletCount): string {
  return min === max ? `${min}` : `${min}–${max}`;
}
