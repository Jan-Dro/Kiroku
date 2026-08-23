export function parseCurrencyToCents(input: string) {
  const normalized = input.replace(/[$,\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Invalid currency amount.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}
