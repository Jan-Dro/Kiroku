type FuelCalculationInput = {
  previousFullOdometer: number | null;
  currentOdometer: number;
  currentVolume: number;
  currentIsFullTank: boolean;
};

export function calculateFuelEconomy(input: FuelCalculationInput) {
  if (!input.currentIsFullTank || input.previousFullOdometer === null) {
    return {
      distance: null,
      mpg: null,
    };
  }

  const distance = input.currentOdometer - input.previousFullOdometer;

  if (distance <= 0) {
    throw new Error("Current odometer must be greater than the previous full fill.");
  }

  return {
    distance,
    mpg: Number((distance / input.currentVolume).toFixed(3)),
  };
}
