export function assertMileageProgression(previous: number | null, next: number) {
  if (previous !== null && next < previous) {
    throw new Error("Mileage cannot move backwards.");
  }
}

export function shouldPromoteCurrentMileage(current: number | null, next: number) {
  return current === null || next > current;
}
