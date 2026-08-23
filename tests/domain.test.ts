import { describe, expect, it } from "vitest";
import { calculateFuelEconomy } from "@/lib/domain/fuel";
import { parseCurrencyToCents } from "@/lib/domain/money";
import { assertMileageProgression, shouldPromoteCurrentMileage } from "@/lib/domain/odometer";

describe("money parsing", () => {
  it("parses currency safely into cents", () => {
    expect(parseCurrencyToCents("54.82")).toBe(BigInt(5482));
  });
});

describe("fuel economy", () => {
  it("calculates mpg only on full fill sequences", () => {
    expect(
      calculateFuelEconomy({
        previousFullOdometer: 1000,
        currentOdometer: 1380,
        currentVolume: 20,
        currentIsFullTank: true,
      }),
    ).toEqual({
      distance: 380,
      mpg: 19,
    });
  });

  it("does not calculate mpg on partial fills", () => {
    expect(
      calculateFuelEconomy({
        previousFullOdometer: 1000,
        currentOdometer: 1250,
        currentVolume: 11,
        currentIsFullTank: false,
      }),
    ).toEqual({
      distance: null,
      mpg: null,
    });
  });
});

describe("odometer progression", () => {
  it("rejects backwards mileage", () => {
    expect(() => assertMileageProgression(12000, 11999)).toThrow("Mileage cannot move backwards.");
  });

  it("does not reduce current mileage for historical entries", () => {
    expect(shouldPromoteCurrentMileage(15000, 14345)).toBe(false);
    expect(shouldPromoteCurrentMileage(15000, 15200)).toBe(true);
  });
});
