/** Parse decimal money without truncation, implicit rounding, or unsafe cents. */
export function parseMoneyCents(
  input: string,
  { allowNegative = false }: { allowNegative?: boolean } = {}
): number | null {
  const normalized = input.trim().replace(/^\./, "0.").replace(/^-\./, "-0.");
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match || (match[1] === "-" && !allowNegative)) return null;

  const magnitude =
    BigInt(match[2]) * BigInt(100) + BigInt((match[3] ?? "").padEnd(2, "0"));
  const cents = Number(match[1] === "-" ? -magnitude : magnitude);
  return Number.isSafeInteger(cents) ? cents : null;
}
