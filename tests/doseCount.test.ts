import { describe, expect, it } from "vitest";
import { countText, tabletCount } from "@/lib/engine/doseCount";

describe("tabletCount — never outside the list's range", () => {
  it("ฟ้าทะลายโจร 1.5–3 g: 500 mg → 3–6, 400 mg → 4–7, 250 mg → 6–12", () => {
    expect(tabletCount(1500, 3000, 500)).toEqual({ min: 3, max: 6 });
    expect(tabletCount(1500, 3000, 400)).toEqual({ min: 4, max: 7 });
    expect(tabletCount(1500, 3000, 250)).toEqual({ min: 6, max: 12 });
  });

  it("ยาหอมเทพจิตร 1–1.4 g with 200 mg tablets → 5–7 (matches ยาสามัญประจำบ้าน wording)", () => {
    expect(tabletCount(1000, 1400, 200)).toEqual({ min: 5, max: 7 });
  });

  it("a fixed dose that doesn't divide evenly gives no count", () => {
    expect(tabletCount(1200, 1200, 500)).toBeNull(); // เพชรสังฆาต 1.2 g
    expect(tabletCount(1200, 1200, 400)).toEqual({ min: 3, max: 3 });
  });

  it("never suggests zero tablets", () => {
    expect(tabletCount(100, 150, 500)).toBeNull();
  });

  it("formats a single number or a range", () => {
    expect(countText({ min: 3, max: 3 })).toBe("3");
    expect(countText({ min: 3, max: 6 })).toBe("3–6");
  });
});
