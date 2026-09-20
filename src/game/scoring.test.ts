import { describe, expect, it } from "vitest";
import { ROLES } from "../config/rules";
import {
  addTotals, isCorrectGuess, lastPlaceIds, pointsForRole, rolesForCount, scoreRound, winnerIds,
} from "./scoring";

describe("rolesForCount", () => {
  it("uses the first N roles in fill order", () => {
    expect(rolesForCount(4)).toEqual(["police", "kallan", "raja", "rani"]);
    expect(rolesForCount(10)).toEqual(ROLES.map((r) => r.id));
  });
  it("always includes police and kallan", () => {
    for (let n = 4; n <= 10; n++) {
      expect(rolesForCount(n)).toContain("police");
      expect(rolesForCount(n)).toContain("kallan");
    }
  });
  it("rejects out-of-range counts", () => {
    expect(() => rolesForCount(3)).toThrow();
    expect(() => rolesForCount(11)).toThrow();
  });
});

describe("pointsForRole", () => {
  it("right guess: police 500, thief 0", () => {
    expect(pointsForRole("police", true, "STEAL")).toBe(500);
    expect(pointsForRole("kallan", true, "STEAL")).toBe(0);
  });
  it("STEAL wrong: thief takes the round's 500, police 0", () => {
    expect(pointsForRole("police", false, "STEAL")).toBe(0);
    expect(pointsForRole("kallan", false, "STEAL")).toBe(500);
  });
  it("PENALTY wrong: police -500, thief 500", () => {
    expect(pointsForRole("police", false, "PENALTY")).toBe(-500);
    expect(pointsForRole("kallan", false, "PENALTY")).toBe(500);
  });
  it("other roles are unaffected by the verdict or mode", () => {
    for (const mode of ["STEAL", "PENALTY"] as const) {
      expect(pointsForRole("raja", true, mode)).toBe(1000);
      expect(pointsForRole("raja", false, mode)).toBe(1000);
    }
    expect(pointsForRole("kunju", true, "STEAL")).toBe(100);
    expect(pointsForRole("chechi", false, "STEAL")).toBe(200);
  });
});

describe("scoreRound", () => {
  const roles = rolesForCount(5); // police, kallan, raja, rani, mantri
  it("scores a right guess", () => {
    expect(isCorrectGuess(roles, 1)).toBe(true);
    expect(scoreRound(roles, 1, "STEAL")).toEqual([500, 0, 1000, 700, 600]);
  });
  it("scores a wrong guess in each mode", () => {
    expect(isCorrectGuess(roles, 2)).toBe(false);
    expect(scoreRound(roles, 2, "STEAL")).toEqual([0, 500, 1000, 700, 600]);
    expect(scoreRound(roles, 2, "PENALTY")).toEqual([-500, 500, 1000, 700, 600]);
  });
  it("works with shuffled role order", () => {
    const shuffled = ["raja", "mantri", "kallan", "police", "rani"] as const;
    expect(scoreRound(shuffled, 2, "STEAL")).toEqual([1000, 600, 0, 500, 700]);
  });
});

describe("totals", () => {
  it("adds deltas to running totals", () => {
    expect(addTotals([100, -500, 0], [50, 500, 20])).toEqual([150, 0, 20]);
  });
  it("finds winners and last place, including ties", () => {
    expect(winnerIds([100, 300, 300, 50])).toEqual([1, 2]);
    expect(lastPlaceIds([100, 300, 300, 50])).toEqual([3]);
    expect(lastPlaceIds([10, 10, 30])).toEqual([0, 1]);
  });
});

