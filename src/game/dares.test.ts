import { describe, expect, it } from "vitest";
import { DARE_LIMITS, sanitizeDares } from "./dares";

const row = (n: number) => ({ short: `D${n}`, text: `Dare ${n}` });

describe("sanitizeDares", () => {
  it("keeps valid rows in order", () => {
    expect(sanitizeDares([row(1), row(2), row(3)])).toEqual([row(1), row(2), row(3)]);
  });
  it("trims, clamps the label and fills a missing dare with the label", () => {
    const out = sanitizeDares([
      { short: "  A very long label  ", text: "  do it  " },
      { short: "B", text: "" },
      row(3),
    ])!;
    expect(out[0]).toEqual({ short: "A very lon", text: "do it" });
    expect(out[1]).toEqual({ short: "B", text: "B" });
  });
  it("drops rows without a label", () => {
    expect(sanitizeDares([row(1), { short: "  ", text: "x" }, row(2), row(3)])).toHaveLength(3);
  });
  it("returns null when too few rows are usable, or the input is not a list", () => {
    expect(sanitizeDares([row(1), row(2)])).toBeNull();
    expect(sanitizeDares("nope")).toBeNull();
    expect(sanitizeDares(null)).toBeNull();
  });
  it("caps the number of rows", () => {
    const many = Array.from({ length: 30 }, (_, i) => row(i));
    expect(sanitizeDares(many)).toHaveLength(DARE_LIMITS.max);
  });
});
